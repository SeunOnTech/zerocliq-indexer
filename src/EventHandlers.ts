/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
    EntryPoint,
    EntryPoint_UserOperationEvent,
} from "../generated";

EntryPoint.UserOperationEvent.handler(async ({ event, context }) => {
    const eventId = `${event.chainId}_${event.block.number}_${event.logIndex}`;

    // 1. Raw Event Entity
    const entity: EntryPoint_UserOperationEvent = {
        id: eventId,
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

    // 2. Account Profile (CRM)
    const accountId = event.params.sender;
    let account = await context.Account.get(accountId);
    if (!account) {
        account = {
            id: accountId,
            totalOps: 0,
            totalGasUsed: 0n,
            lastActive: event.block.timestamp,
        };
    }
    account = {
        ...account,
        totalOps: account.totalOps + 1,
        totalGasUsed: account.totalGasUsed + event.params.actualGasUsed,
        lastActive: event.block.timestamp,
    };
    context.Account.set(account);

    // 3. Paymaster Leaderboard (Infra)
    const paymasterId = event.params.paymaster;
    if (paymasterId && paymasterId !== "0x0000000000000000000000000000000000000000") {
        let paymaster = await context.Paymaster.get(paymasterId);
        if (!paymaster) {
            paymaster = {
                id: paymasterId,
                totalSponsored: 0n,
                opsCount: 0,
                lastActive: event.block.timestamp,
            };
        }
        paymaster = {
            ...paymaster,
            totalSponsored: paymaster.totalSponsored + event.params.actualGasCost,
            opsCount: paymaster.opsCount + 1,
            lastActive: event.block.timestamp,
        };
        context.Paymaster.set(paymaster);
    }

    // 4. Hourly Stats (Time-Series)
    // Create a time bucket ID: e.g., "2024-01-01-15" (Hour 15)
    // actually, simpler to use Unix timestamp of the hour start
    const hourStart = event.block.timestamp - (event.block.timestamp % 3600);
    const hourlyId = `${event.chainId}-${hourStart}`;

    let hourlyStat = await context.HourlyStat.get(hourlyId);
    if (!hourlyStat) {
        hourlyStat = {
            id: hourlyId,
            timestamp: hourStart,
            opsCount: 0,
            gasUsed: 0n,
        };
    }
    hourlyStat = {
        ...hourlyStat,
        opsCount: hourlyStat.opsCount + 1,
        gasUsed: hourlyStat.gasUsed + event.params.actualGasUsed,
    };
    context.HourlyStat.set(hourlyStat);


    // 5. Global Aggregates (Network Pulse)
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
        totalGasUsed: globalStats.totalGasUsed + event.params.actualGasUsed,
        totalTransactions: globalStats.totalTransactions + 1n,
    };

    context.GlobalAggregate.set(globalStats);
});
