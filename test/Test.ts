import assert from "assert";
import { 
  TestHelpers,
  EntryPoint_UserOperationEvent
} from "generated";
const { MockDb, EntryPoint } = TestHelpers;

describe("EntryPoint contract UserOperationEvent event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for EntryPoint contract UserOperationEvent event
  const event = EntryPoint.UserOperationEvent.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("EntryPoint_UserOperationEvent is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await EntryPoint.UserOperationEvent.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualEntryPointUserOperationEvent = mockDbUpdated.entities.EntryPoint_UserOperationEvent.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedEntryPointUserOperationEvent: EntryPoint_UserOperationEvent = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      userOpHash: event.params.userOpHash,
      sender: event.params.sender,
      paymaster: event.params.paymaster,
      nonce: event.params.nonce,
      success: event.params.success,
      actualGasCost: event.params.actualGasCost,
      actualGasUsed: event.params.actualGasUsed,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualEntryPointUserOperationEvent, expectedEntryPointUserOperationEvent, "Actual EntryPointUserOperationEvent should be the same as the expectedEntryPointUserOperationEvent");
  });
});
