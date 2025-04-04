# Colors for terminal output
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RESET := \033[0m

# Project variables
PROJECT_NAME := portfolio

.PHONY: help
help: ## Show this help message
	@printf "${CYAN}Usage:${RESET}\n"
	@printf "  make ${YELLOW}<target>${RESET}\n"
	@printf "\n"
	@printf "${CYAN}Targets:${RESET}\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  ${YELLOW}%-20s${RESET} %s\n", $$1, $$2}'

.PHONY: ui-setup
ui-setup: ## Install project dependencies
	@echo "${CYAN}Installing project dependencies...${RESET}"
	npm install

.PHONY: ui-build
ui-build: ## Build the project
	@echo "${CYAN}Building the project...${RESET}"
	npm run build

.PHONY: ui-docs
ui-docs: ## Start documentation server
	@echo "${CYAN}Starting documentation server...${RESET}"
	npm run docs

.PHONY: ui-test
ui-test: ## Run tests
	@echo "${CYAN}Running tests...${RESET}"
	npm run test

.PHONY: ui-check
ui-check: ## Run type checking and formatting check
	@echo "${CYAN}Running checks...${RESET}"
	npm run check

.PHONY: ui-format
ui-format: ## Format code
	@echo "${CYAN}Formatting code...${RESET}"
	npm run format

.PHONY: ui-clean
ui-clean: ## Clean up build artifacts and dependencies
	@echo "${CYAN}Cleaning up...${RESET}"
	rm -rf node_modules
	rm -rf build
	rm -rf .cache

.PHONY: ui-update
ui-update: ## Update dependencies
	@echo "${CYAN}Updating npm dependencies...${RESET}"
	npm update

.PHONY: ui-reset
ui-reset: ui-clean ui-setup ## Reset the project (clean and reinstall)

.PHONY: ui-dev
ui-dev: ## Start development environment
	@echo "${CYAN}Starting development environment...${RESET}"
	npm run docs

.PHONY: ui-lint
ui-lint: ui-check ## Alias for check command