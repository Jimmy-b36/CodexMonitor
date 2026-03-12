use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;
use crate::types::{AgentProvider, AppSettings, WorkspaceSettings};

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub(crate) enum ProviderErrorCode {
    UnsupportedCapability,
    ProviderUnavailable,
    AuthRequired,
    InvalidRequest,
    UpstreamError,
    Timeout,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub(crate) struct ProviderCapabilities {
    pub(crate) thread_start: bool,
    pub(crate) thread_resume: bool,
    pub(crate) thread_list: bool,
    pub(crate) message_send: bool,
    pub(crate) models_list: bool,
    pub(crate) login: bool,
    pub(crate) feature_flags: bool,
    pub(crate) skills_list: bool,
    pub(crate) apps_list: bool,
    pub(crate) collaboration_modes: bool,
    pub(crate) review_start: bool,
    pub(crate) fork_thread: bool,
    pub(crate) archive_thread: bool,
    pub(crate) compact_thread: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub(crate) struct ProviderDescriptor {
    pub(crate) id: AgentProvider,
    pub(crate) label: String,
    pub(crate) version: String,
    pub(crate) capabilities: ProviderCapabilities,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub(crate) enum ProviderConnectionState {
    Connected,
    Disconnected,
    Connecting,
    Error,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub(crate) struct ProviderSessionHandle {
    pub(crate) workspace_id: String,
    pub(crate) provider_id: AgentProvider,
    pub(crate) connection_state: ProviderConnectionState,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub(crate) struct ProviderRequestContext {
    pub(crate) workspace_id: String,
    #[serde(default)]
    pub(crate) thread_id: Option<String>,
    #[serde(default)]
    pub(crate) metadata: BTreeMap<String, Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ProviderError {
    pub(crate) code: ProviderErrorCode,
    pub(crate) message: String,
    pub(crate) retryable: bool,
    #[serde(default)]
    pub(crate) capability: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub(crate) struct CanonicalEvent {
    pub(crate) workspace_id: String,
    pub(crate) method: String,
    pub(crate) params: Value,
    pub(crate) provider_id: AgentProvider,
    #[serde(default)]
    pub(crate) raw: Option<Value>,
}

#[allow(dead_code)]
pub(crate) fn resolve_agent_provider(
    workspace_settings: Option<&WorkspaceSettings>,
    app_settings: &AppSettings,
) -> AgentProvider {
    workspace_settings
        .and_then(|settings| settings.agent_provider)
        .unwrap_or(app_settings.default_agent_provider)
}

#[cfg(test)]
mod tests {
    use super::resolve_agent_provider;
    use crate::types::{AgentProvider, AppSettings, WorkspaceSettings};

    #[test]
    fn resolve_agent_provider_uses_workspace_override() {
        let app_settings = AppSettings {
            default_agent_provider: AgentProvider::Codex,
            ..AppSettings::default()
        };
        let workspace_settings = WorkspaceSettings {
            agent_provider: Some(AgentProvider::Copilot),
            ..WorkspaceSettings::default()
        };
        let resolved = resolve_agent_provider(Some(&workspace_settings), &app_settings);
        assert!(matches!(resolved, AgentProvider::Copilot));
    }

    #[test]
    fn resolve_agent_provider_falls_back_to_app_default() {
        let app_settings = AppSettings {
            default_agent_provider: AgentProvider::Copilot,
            ..AppSettings::default()
        };
        let resolved = resolve_agent_provider(None, &app_settings);
        assert!(matches!(resolved, AgentProvider::Copilot));
    }
}
