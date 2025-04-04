# Development Environment with Devbox

This project uses [Devbox](https://www.jetpack.io/devbox) to create reproducible development environments. Devbox ensures that all developers work with the same versions of tools and dependencies.

## Prerequisites

1. Install Devbox on your system:

   ```bash
   # macOS/Linux
   curl -fsSL https://get.jetpack.io/devbox | bash

   # Verify installation
   devbox version
   ```

2. (Optional) Install direnv for automatic environment switching:
   ```bash
   # macOS (using Homebrew)
   brew install direnv

   # Add to your ~/.zshrc or ~/.bashrc:
   eval "$(direnv hook zsh)"  # for zsh
   # or
   eval "$(direnv hook bash)" # for bash
   ```

## Getting Started

1. Clone the repository and navigate to the project directory:
   ```bash
   cd portfolio
   ```

2. Initialize the Devbox environment:
   ```bash
   devbox init
   ```

3. Enter the Devbox shell:
   ```bash
   devbox shell
   ```

4. The environment will automatically install project dependencies (`npm install`).

## Available Commands

Inside the Devbox shell, you can use all the regular npm commands. Additionally, you can use these devbox-specific commands:

```bash
# Build the project
devbox run build

# Start development server with documentation
devbox run docs

# Run tests
devbox run test

# Check types and formatting
devbox run check

# Format code
devbox run format
```

## Environment Details

The Devbox environment includes:
- Node.js 20
- TypeScript

## Using direnv (Optional)

If you have direnv installed, the development environment will automatically activate when you enter the project directory. To enable this:

1. Allow direnv to execute in this directory:
   ```bash
   direnv allow
   ```

2. The environment will now automatically load when you enter the directory.

## Troubleshooting

1. If you encounter permission issues:
   ```bash
   # Reset Devbox permissions
   devbox clean
   devbox init
   ```

2. If dependencies aren't working correctly:
   ```bash
   # Rebuild the environment
   devbox clean
   devbox init
   devbox shell
   npm install
   ```

3. To update Devbox:
   ```bash
   # Update Devbox itself
   devbox version update
   ```

## Project-Specific Notes

- The environment is configured to automatically run `npm install` when entering the shell
- All npm scripts from package.json are available through both npm and devbox commands
- Node.js version is set to 20 as required by the project
- The `.devbox` directory is git-ignored to prevent conflicts

## Additional Resources

- [Devbox Documentation](https://www.jetpack.io/devbox/docs/)
- [Devbox GitHub Repository](https://github.com/jetpack-io/devbox)