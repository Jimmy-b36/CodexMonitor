use serde_json::Value;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::backend::app_server::WorkspaceSession;
use crate::shared::codex_core;
use crate::shared::provider_acp::{ProviderError, ProviderErrorCode};
use crate::types::{AppSettings, WorkspaceEntry, WorkspaceSettings};

pub(crate) async fn resolve_provider_for_workspace_core(
    workspace_id: &str,
    workspaces: &Mutex<HashMap<String, WorkspaceEntry>>,
    app_settings: &Mutex<AppSettings>,
) -> crate::types::AgentProvider {
    let workspace_settings: Option<WorkspaceSettings> = {
        let workspaces = workspaces.lock().await;
        workspaces.get(workspace_id).map(|entry| entry.settings.clone())
    };
    let app_settings = app_settings.lock().await.clone();
    workspace_settings
        .and_then(|settings| settings.agent_provider)
        .unwrap_or(app_settings.default_agent_provider)
}

fn provider_error_string(error: ProviderError) -> String {
    serde_json::to_string(&error).unwrap_or_else(|_| error.message)
}

fn unsupported_capability_error(capability: &str) -> String {
    provider_error_string(ProviderError {
        code: ProviderErrorCode::UnsupportedCapability,
        message: format!("Provider does not support capability `{capability}`"),
        retryable: false,
        capability: Some(capability.to_string()),
    })
}

pub(crate) async fn model_list_via_provider_core(
    sessions: &Mutex<HashMap<String, Arc<WorkspaceSession>>>,
    workspaces: &Mutex<HashMap<String, WorkspaceEntry>>,
    app_settings: &Mutex<AppSettings>,
    workspace_id: String,
) -> Result<Value, String> {
    let provider =
        resolve_provider_for_workspace_core(&workspace_id, workspaces, app_settings).await;
    match provider {
        crate::types::AgentProvider::Codex => codex_core::model_list_core(sessions, workspace_id).await,
        crate::types::AgentProvider::Copilot => Err(unsupported_capability_error("modelsList")),
    }
}

#[cfg(test)]
mod tests {
    use super::{resolve_provider_for_workspace_core, unsupported_capability_error};
    use crate::types::{AgentProvider, AppSettings, WorkspaceEntry, WorkspaceKind, WorkspaceSettings};
    use std::collections::HashMap;
    use tokio::runtime::Runtime;
    use tokio::sync::Mutex;

    #[test]
    fn unsupported_capability_error_has_stable_shape() {
        let raw = unsupported_capability_error("modelsList");
        let value: serde_json::Value =
            serde_json::from_str(&raw).expect("error should be valid json");
        assert_eq!(value.get("code").and_then(|v| v.as_str()), Some("unsupported_capability"));
        assert_eq!(value.get("retryable").and_then(|v| v.as_bool()), Some(false));
        assert_eq!(
            value.get("capability").and_then(|v| v.as_str()),
            Some("modelsList")
        );
    }

    #[test]
    fn resolves_provider_with_workspace_override_precedence() {
        let rt = Runtime::new().expect("runtime");
        rt.block_on(async {
            let workspaces = Mutex::new(HashMap::from([(
                "w1".to_string(),
                WorkspaceEntry {
                    id: "w1".to_string(),
                    name: "Workspace".to_string(),
                    path: "/tmp".to_string(),
                    kind: WorkspaceKind::Main,
                    parent_id: None,
                    worktree: None,
                    settings: WorkspaceSettings {
                        agent_provider: Some(AgentProvider::Copilot),
                        ..WorkspaceSettings::default()
                    },
                },
            )]));
            let app_settings = Mutex::new(AppSettings {
                default_agent_provider: AgentProvider::Codex,
                ..AppSettings::default()
            });
            let provider = resolve_provider_for_workspace_core("w1", &workspaces, &app_settings).await;
            assert!(matches!(provider, AgentProvider::Copilot));
        });
    }

    #[test]
    fn resolves_provider_with_app_default_when_workspace_missing() {
        let rt = Runtime::new().expect("runtime");
        rt.block_on(async {
            let workspaces = Mutex::new(HashMap::new());
            let app_settings = Mutex::new(AppSettings {
                default_agent_provider: AgentProvider::Copilot,
                ..AppSettings::default()
            });
            let provider = resolve_provider_for_workspace_core("missing", &workspaces, &app_settings).await;
            assert!(matches!(provider, AgentProvider::Copilot));
        });
    }
}
