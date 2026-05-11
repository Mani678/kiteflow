// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WorkflowAttestation
 * @notice KiteFlow on-chain proof layer.
 *         Every agent task — input hash, output hash, cost, latency — is permanently recorded.
 *         Agent reputation scores are computed and stored on-chain.
 *         The orchestrator reads reputation BEFORE selecting agents.
 */
contract WorkflowAttestation {

    // ─── Structs ───────────────────────────────────────────────────────────────

    struct WorkflowRun {
        bytes32 workflowId;
        address initiator;
        bytes32 goalHash;
        uint256 totalBudgetUsdc;
        uint256 totalSpentUsdc;
        uint256 startTime;
        uint256 endTime;
        bool completed;
        bool refunded;
        uint8 stepCount;
    }

    struct TaskAttestation {
        bytes32 workflowId;
        uint8 stepIndex;
        string agentId;
        bytes32 inputHash;
        bytes32 outputHash;
        uint256 paidUsdc;
        uint256 latencyMs;
        uint256 timestamp;
        bool success;
        bool agentWasFired;
    }

    struct AgentStats {
        string agentId;
        string name;
        string endpoint;
        string category;
        string pricingModel;
        uint256 pricePerTaskUsdc;
        uint256 totalTasks;
        uint256 successfulTasks;
        uint256 totalEarnedUsdc;
        uint256 totalLatencyMs;
        uint256 fireCount;
        bool registered;
    }

    // ─── State ─────────────────────────────────────────────────────────────────

    address public owner;

    mapping(bytes32 => WorkflowRun) public workflows;
    mapping(bytes32 => TaskAttestation[]) public workflowTasks;
    mapping(string => AgentStats) public agentStats;

    bytes32[] public allWorkflowIds;
    string[] public registeredAgentIds;

    uint256 public totalUsdcSettled;
    uint256 public totalWorkflowsRun;
    uint256 public totalTasksAttested;

    // ─── Events ────────────────────────────────────────────────────────────────

    event WorkflowStarted(
        bytes32 indexed workflowId,
        address indexed initiator,
        uint256 budgetUsdc,
        uint256 timestamp
    );

    event TaskAttested(
        bytes32 indexed workflowId,
        uint8 indexed stepIndex,
        string agentId,
        bytes32 outputHash,
        uint256 paidUsdc,
        uint256 latencyMs,
        bool success
    );

    event AgentFired(
        bytes32 indexed workflowId,
        string agentId,
        string reason,
        uint256 timestamp
    );

    event WorkflowCompleted(
        bytes32 indexed workflowId,
        uint256 totalSpentUsdc,
        uint8 stepCount,
        uint256 durationSeconds
    );

    event WorkflowRefunded(
        bytes32 indexed workflowId,
        string reason,
        uint256 timestamp
    );

    event AgentRegistered(
        string agentId,
        string name,
        string category,
        uint256 pricePerTaskUsdc
    );

    // ─── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "KiteFlow: not owner");
        _;
    }

    modifier workflowExists(bytes32 workflowId) {
        require(
            workflows[workflowId].initiator != address(0),
            "KiteFlow: workflow not found"
        );
        _;
    }

    // ─── Constructor ───────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── Agent Registry ────────────────────────────────────────────────────────

    function registerAgent(
        string calldata agentId,
        string calldata name,
        string calldata endpoint,
        string calldata category,
        string calldata pricingModel,
        uint256 pricePerTaskUsdc
    ) external {
        require(bytes(agentId).length > 0, "KiteFlow: empty agentId");
        require(
            !agentStats[agentId].registered,
            "KiteFlow: agent already registered"
        );

        agentStats[agentId] = AgentStats({
            agentId: agentId,
            name: name,
            endpoint: endpoint,
            category: category,
            pricingModel: pricingModel,
            pricePerTaskUsdc: pricePerTaskUsdc,
            totalTasks: 0,
            successfulTasks: 0,
            totalEarnedUsdc: 0,
            totalLatencyMs: 0,
            fireCount: 0,
            registered: true
        });

        registeredAgentIds.push(agentId);
        emit AgentRegistered(agentId, name, category, pricePerTaskUsdc);
    }

    // ─── Workflow Lifecycle ────────────────────────────────────────────────────

    function startWorkflow(
        bytes32 workflowId,
        bytes32 goalHash,
        uint256 budgetUsdc
    ) external {
        require(
            workflows[workflowId].initiator == address(0),
            "KiteFlow: workflow exists"
        );

        workflows[workflowId] = WorkflowRun({
            workflowId: workflowId,
            initiator: msg.sender,
            goalHash: goalHash,
            totalBudgetUsdc: budgetUsdc,
            totalSpentUsdc: 0,
            startTime: block.timestamp,
            endTime: 0,
            completed: false,
            refunded: false,
            stepCount: 0
        });

        allWorkflowIds.push(workflowId);
        totalWorkflowsRun++;

        emit WorkflowStarted(workflowId, msg.sender, budgetUsdc, block.timestamp);
    }

    function attestTask(
        bytes32 workflowId,
        string calldata agentId,
        bytes32 inputHash,
        bytes32 outputHash,
        uint256 paidUsdc,
        uint256 latencyMs,
        bool success,
        bool agentWasFired
    ) external workflowExists(workflowId) {
        WorkflowRun storage run = workflows[workflowId];
        require(!run.completed, "KiteFlow: workflow finalized");

        uint8 stepIndex = run.stepCount;

        workflowTasks[workflowId].push(
            TaskAttestation({
                workflowId: workflowId,
                stepIndex: stepIndex,
                agentId: agentId,
                inputHash: inputHash,
                outputHash: outputHash,
                paidUsdc: paidUsdc,
                latencyMs: latencyMs,
                timestamp: block.timestamp,
                success: success,
                agentWasFired: agentWasFired
            })
        );

        run.totalSpentUsdc += paidUsdc;
        run.stepCount++;
        totalTasksAttested++;
        totalUsdcSettled += paidUsdc;

        if (agentStats[agentId].registered) {
            AgentStats storage stats = agentStats[agentId];
            stats.totalTasks++;
            stats.totalLatencyMs += latencyMs;
            if (success) {
                stats.successfulTasks++;
                stats.totalEarnedUsdc += paidUsdc;
            }
            if (agentWasFired) {
                stats.fireCount++;
            }
        }

        emit TaskAttested(
            workflowId,
            stepIndex,
            agentId,
            outputHash,
            paidUsdc,
            latencyMs,
            success
        );
    }

    function recordAgentFired(
        bytes32 workflowId,
        string calldata agentId,
        string calldata reason
    ) external workflowExists(workflowId) {
        if (agentStats[agentId].registered) {
            agentStats[agentId].fireCount++;
        }
        emit AgentFired(workflowId, agentId, reason, block.timestamp);
    }

    function recordRefund(
        bytes32 workflowId,
        string calldata reason
    ) external workflowExists(workflowId) {
        WorkflowRun storage run = workflows[workflowId];
        require(!run.completed, "KiteFlow: already finalized");
        run.refunded = true;
        run.completed = true;
        run.endTime = block.timestamp;
        emit WorkflowRefunded(workflowId, reason, block.timestamp);
    }

    function finalizeWorkflow(
        bytes32 workflowId
    ) external workflowExists(workflowId) {
        WorkflowRun storage run = workflows[workflowId];
        require(!run.completed, "KiteFlow: already finalized");

        run.endTime = block.timestamp;
        run.completed = true;

        uint256 durationSeconds = run.endTime - run.startTime;

        emit WorkflowCompleted(
            workflowId,
            run.totalSpentUsdc,
            run.stepCount,
            durationSeconds
        );
    }

    // ─── Reputation ────────────────────────────────────────────────────────────

    /**
     * @notice Returns a 0-100 reputation score for an agent.
     *         70% weight on success rate + 20% on latency + 10% penalty for fires.
     *         This is what the orchestrator reads before selecting agents.
     */
    function getAgentReputationScore(
        string calldata agentId
    ) external view returns (uint256 score) {
        AgentStats storage s = agentStats[agentId];
        if (!s.registered || s.totalTasks == 0) return 50;

        uint256 successRate = (s.successfulTasks * 100) / s.totalTasks;

        uint256 avgLatency = s.totalLatencyMs / s.totalTasks;
        uint256 latencyScore;
        if (avgLatency < 1000) {
            latencyScore = 100;
        } else if (avgLatency < 3000) {
            latencyScore = 80;
        } else if (avgLatency < 6000) {
            latencyScore = 60;
        } else if (avgLatency < 10000) {
            latencyScore = 40;
        } else {
            latencyScore = 10;
        }

        uint256 firePenalty = s.fireCount * 5;
        if (firePenalty > 30) firePenalty = 30;

        uint256 raw = (successRate * 70 + latencyScore * 20) / 100;
        score = raw > firePenalty ? raw - firePenalty : 0;
    }

    // ─── Read Helpers ──────────────────────────────────────────────────────────

    function getWorkflowTasks(
        bytes32 workflowId
    ) external view returns (TaskAttestation[] memory) {
        return workflowTasks[workflowId];
    }

    function getAllWorkflowIds() external view returns (bytes32[] memory) {
        return allWorkflowIds;
    }

    function getRegisteredAgents() external view returns (string[] memory) {
        return registeredAgentIds;
    }

    function getAgentCount() external view returns (uint256) {
        return registeredAgentIds.length;
    }

    function getWorkflowCount() external view returns (uint256) {
        return allWorkflowIds.length;
    }

    function getProtocolStats()
        external
        view
        returns (
            uint256 workflows,
            uint256 tasks,
            uint256 usdc,
            uint256 agents
        )
    {
        return (
            totalWorkflowsRun,
            totalTasksAttested,
            totalUsdcSettled,
            registeredAgentIds.length
        );
    }
}
