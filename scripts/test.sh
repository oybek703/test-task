#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing Permissions Microservice${NC}"

# Функция для выполнения NATS запроса
nats_request() {
    local subject=$1
    local data=$2
    echo -e "${YELLOW}Request to $subject:${NC}"
    echo "$data"
    echo -e "${YELLOW}Response:${NC}"
    nats req "$subject" "$data" --timeout=5s
    echo ""
}

# Тест 1: Grant permission
echo -e "${GREEN}Test 1: Grant permission${NC}"
nats_request "permissions.grant" '{"apiKey":"test-key","module":"trades","action":"create"}'

# Тест 2: Check permission (should be true)
echo -e "${GREEN}Test 2: Check permission (should be true)${NC}"
nats_request "permissions.check" '{"apiKey":"test-key","module":"trades","action":"create"}'

# Тест 3: List permissions
echo -e "${GREEN}Test 3: List permissions${NC}"
nats_request "permissions.list" '{"apiKey":"test-key"}'

# Тест 4: Grant another permission
echo -e "${GREEN}Test 4: Grant another permission${NC}"
nats_request "permissions.grant" '{"apiKey":"test-key","module":"trades","action":"delete"}'

# Тест 5: List permissions again
echo -e "${GREEN}Test 5: List permissions again${NC}"
nats_request "permissions.list" '{"apiKey":"test-key"}'

# Тест 6: Check non-existent permission
echo -e "${GREEN}Test 6: Check non-existent permission${NC}"
nats_request "permissions.check" '{"apiKey":"test-key","module":"trades","action":"update"}'

# Тест 7: Revoke permission
echo -e "${GREEN}Test 7: Revoke permission${NC}"
nats_request "permissions.revoke" '{"apiKey":"test-key","module":"trades","action":"create"}'

# Тест 8: Check revoked permission
echo -e "${GREEN}Test 8: Check revoked permission${NC}"
nats_request "permissions.check" '{"apiKey":"test-key","module":"trades","action":"create"}'

# Тест 9: Error handling - invalid payload
echo -e "${GREEN}Test 9: Error handling - invalid payload${NC}"
nats_request "permissions.check" '{"apiKey":"test-key"}'

echo -e "${GREEN}All tests completed!${NC}"