/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
    EntryPoint,
    EntryPoint_UserOperationEvent,
} from "../generated";

EntryPoint.UserOperationEvent.handler(async ({ event, context }) => {
    const entity: EntryPoint_UserOperationEvent = {
        id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
        userOpHash: event.params.userOpHash,
        sender: event.params.sender,
        paymaster: event.params.paymaster,
        nonce: event.params.nonce,
        success: event.params.success,
        actualGasCost: event.params.actualGasCost,
        actualGasUsed: event.params.actualGasUsed,
        transactionHash: event.transaction.hash,
        blockNumber: event.block.number,
        blockTimestamp: event.block.timestamp,
    };

    context.EntryPoint_UserOperationEvent.set(entity);

    // Update Global Aggregates
    const GLOBAL_ID = "GLOBAL";
    let globalStats = await context.GlobalAggregate.get(GLOBAL_ID);

    if (!globalStats) {
        globalStats = {
            id: GLOBAL_ID,
            totalOps: 0n,
            totalGasUsed: 0n,
            totalTransactions: 0n,
        };
    }

    globalStats = {
        ...globalStats,
        totalOps: globalStats.totalOps + 1n,
        totalGasUsed: globalStats.totalGasUsed + event.params.actualGasCost,
        totalTransactions: globalStats.totalTransactions + 1n, // Same as ops for now
    };

    context.GlobalAggregate.set(globalStats);
});
