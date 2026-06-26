#!/bin/bash

# Define the dotfiles directory (where this script resides)
DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Define the backup directory
BACKUP_DIR="$HOME/.dotfiles_backup_$(date +%Y%m%d_%H%M%S)"

echo "Starting dotfiles installation..."
echo "Dotfiles source: $DOTFILES_DIR"
echo "Backup directory: $BACKUP_DIR"

# Function to create a backup and symlink
symlink_file_or_dir() {
    local source_path="$1"
    local target_path="$2"

    # Ensure the parent directory of the target exists
    mkdir -p "$(dirname "$target_path")"

    if [ -e "$target_path" ] || [ -L "$target_path" ]; then
        echo "  Backing up existing $target_path to $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
        mv "$target_path" "$BACKUP_DIR/"
    fi

    echo "  Creating symlink: $source_path -> $target_path"
    ln -s "$source_path" "$target_path"
}

# --- AI Agents Dotfiles ---
echo ""
echo "--- Processing AI Agent Dotfiles ---"

# Symlink agents/AGENTS.md
symlink_file_or_dir "$DOTFILES_DIR/agents/AGENTS.md" "$HOME/.claude/AGENTS.md" # Assuming .claude for initial agent config

# Symlink prompt_templates (as a directory)
symlink_file_or_dir "$DOTFILES_DIR/agents/prompt_templates" "$HOME/.claude/prompt_templates"

# NOTE: CLAUDE.md and COPILOT.md are instructional/referential for now,
# not directly symlinked as config files.

# --- AI Config Dotfiles ---
echo ""
echo "--- Processing AI Config Dotfiles ---"

# Example: Symlink Claude settings.json
symlink_file_or_dir "$DOTFILES_DIR/config/claude/settings.json" "$HOME/.claude/settings.json"

# Example: Symlink Copilot VS Code settings
symlink_file_or_dir "$DOTFILES_DIR/config/copilot/vscode_settings.json" "$HOME/.config/Code/User/settings.json" # Adjust path as needed for VS Code or other editors

# --- OpenClaw Skills Dotfiles ---
echo ""
echo "--- Processing OpenClaw Skills Dotfiles ---"

# Example: Symlink a custom skill directory
# For now, OpenClaw skills are typically managed via `openclaw install skill`
# or by placing them directly in ~/.openclaw/workspace/skills.
# If you want to symlink a *whole skill directory* from your dotfiles:
# symlink_file_or_dir "$DOTFILES_DIR/skills/my_utility_skill" "$HOME/.openclaw/workspace/skills/my_utility_skill"


echo ""
echo "Dotfiles installation complete. Backups (if any) are in $BACKUP_DIR"
