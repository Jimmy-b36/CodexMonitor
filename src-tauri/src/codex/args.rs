use crate::types::{AppSettings, WorkspaceEntry};

pub(crate) fn parse_codex_args(value: Option<&str>) -> Result<Vec<String>, String> {
    let raw = match value {
        Some(raw) if !raw.trim().is_empty() => raw.trim(),
        _ => return Ok(Vec::new()),
    };
    shell_words::split(raw)
        .map_err(|err| format!("Invalid Codex args: {err}"))
        .map(|args| args.into_iter().filter(|arg| !arg.is_empty()).collect())
}

pub(crate) fn resolve_workspace_codex_args(
    entry: &WorkspaceEntry,
    _parent_entry: Option<&WorkspaceEntry>,
    app_settings: Option<&AppSettings>,
) -> Option<String> {
    let base_args = app_settings
        .and_then(|settings| settings.codex_args.as_deref())
        .and_then(normalize_codex_args);
    let provider = entry
        .settings
        .agent_provider
        .or_else(|| app_settings.map(|settings| settings.default_agent_provider))
        .unwrap_or(crate::types::AgentProvider::Codex);

    if let Some(parsed) = base_args
        .as_deref()
        .and_then(|value| parse_codex_args(Some(value)).ok())
    {
        let mut normalized = strip_local_provider_arg(parsed);
        if provider == crate::types::AgentProvider::Copilot {
            normalized.push("--local-provider".to_string());
            normalized.push("copilot".to_string());
        }
        if normalized.is_empty() {
            return None;
        }
        return Some(shell_words::join(normalized));
    }

    if provider == crate::types::AgentProvider::Copilot {
        return Some(match base_args {
            Some(value) => format!("{value} --local-provider copilot"),
            None => "--local-provider copilot".to_string(),
        });
    }

    base_args
}

fn normalize_codex_args(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_string())
    }
}

fn strip_local_provider_arg(args: Vec<String>) -> Vec<String> {
    let mut output = Vec::with_capacity(args.len());
    let mut i = 0;
    while i < args.len() {
        let token = &args[i];
        if token == "--local-provider" {
            i += 2;
            continue;
        }
        if token.starts_with("--local-provider=") {
            i += 1;
            continue;
        }
        output.push(token.clone());
        i += 1;
    }
    output
}

#[cfg(test)]
mod tests {
    use super::{parse_codex_args, resolve_workspace_codex_args};
    use crate::types::{AppSettings, WorkspaceEntry, WorkspaceKind, WorkspaceSettings};

    #[test]
    fn parses_empty_args() {
        assert!(parse_codex_args(None).expect("parse none").is_empty());
        assert!(parse_codex_args(Some("   "))
            .expect("parse blanks")
            .is_empty());
    }

    #[test]
    fn parses_simple_args() {
        let args = parse_codex_args(Some("--profile personal --flag")).expect("parse args");
        assert_eq!(args, vec!["--profile", "personal", "--flag"]);
    }

    #[test]
    fn parses_quoted_args() {
        let args = parse_codex_args(Some("--path \"a b\" --name='c d'")).expect("parse args");
        assert_eq!(args, vec!["--path", "a b", "--name=c d"]);
    }

    #[test]
    fn resolves_workspace_codex_args_from_app_settings_only() {
        let mut app_settings = AppSettings::default();
        app_settings.codex_args = Some("--profile app".to_string());

        let parent = WorkspaceEntry {
            id: "parent".to_string(),
            name: "Parent".to_string(),
            path: "/tmp/parent".to_string(),
            kind: WorkspaceKind::Main,
            parent_id: None,
            worktree: None,
            settings: WorkspaceSettings::default(),
        };

        let child = WorkspaceEntry {
            id: "child".to_string(),
            name: "Child".to_string(),
            path: "/tmp/child".to_string(),
            kind: WorkspaceKind::Worktree,
            parent_id: Some(parent.id.clone()),
            worktree: None,
            settings: WorkspaceSettings::default(),
        };

        let resolved = resolve_workspace_codex_args(&child, Some(&parent), Some(&app_settings));
        assert_eq!(resolved.as_deref(), Some("--profile app"));

        let main = WorkspaceEntry {
            id: "main".to_string(),
            name: "Main".to_string(),
            path: "/tmp/main".to_string(),
            kind: WorkspaceKind::Main,
            parent_id: None,
            worktree: None,
            settings: WorkspaceSettings::default(),
        };
        let resolved_main = resolve_workspace_codex_args(&main, None, Some(&app_settings));
        assert_eq!(resolved_main.as_deref(), Some("--profile app"));
    }

    #[test]
    fn resolves_workspace_codex_args_adds_copilot_local_provider_from_workspace_override() {
        let mut app_settings = AppSettings::default();
        app_settings.codex_args = Some("--profile app".to_string());
        app_settings.default_agent_provider = crate::types::AgentProvider::Codex;

        let workspace = WorkspaceEntry {
            id: "workspace".to_string(),
            name: "Workspace".to_string(),
            path: "/tmp/workspace".to_string(),
            kind: WorkspaceKind::Main,
            parent_id: None,
            worktree: None,
            settings: WorkspaceSettings {
                agent_provider: Some(crate::types::AgentProvider::Copilot),
                ..WorkspaceSettings::default()
            },
        };

        let resolved = resolve_workspace_codex_args(&workspace, None, Some(&app_settings));
        assert_eq!(
            resolved.as_deref(),
            Some("--profile app --local-provider copilot")
        );
    }

    #[test]
    fn resolves_workspace_codex_args_adds_copilot_local_provider_from_app_default() {
        let mut app_settings = AppSettings::default();
        app_settings.default_agent_provider = crate::types::AgentProvider::Copilot;

        let workspace = WorkspaceEntry {
            id: "workspace".to_string(),
            name: "Workspace".to_string(),
            path: "/tmp/workspace".to_string(),
            kind: WorkspaceKind::Main,
            parent_id: None,
            worktree: None,
            settings: WorkspaceSettings::default(),
        };

        let resolved = resolve_workspace_codex_args(&workspace, None, Some(&app_settings));
        assert_eq!(resolved.as_deref(), Some("--local-provider copilot"));
    }

    #[test]
    fn resolves_workspace_codex_args_replaces_existing_local_provider_flag() {
        let mut app_settings = AppSettings::default();
        app_settings.default_agent_provider = crate::types::AgentProvider::Copilot;
        app_settings.codex_args = Some("--profile app --local-provider codex".to_string());

        let workspace = WorkspaceEntry {
            id: "workspace".to_string(),
            name: "Workspace".to_string(),
            path: "/tmp/workspace".to_string(),
            kind: WorkspaceKind::Main,
            parent_id: None,
            worktree: None,
            settings: WorkspaceSettings::default(),
        };

        let resolved = resolve_workspace_codex_args(&workspace, None, Some(&app_settings));
        assert_eq!(
            resolved.as_deref(),
            Some("--profile app --local-provider copilot")
        );
    }
}
