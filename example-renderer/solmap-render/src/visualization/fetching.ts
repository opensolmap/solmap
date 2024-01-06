import { ConfirmedTransactionMeta, Connection, TransactionVersion, VersionedMessage } from '@solana/web3.js';

export interface Tx {
	transaction: {
		message: VersionedMessage;
		signatures: string[];
	};
	meta: ConfirmedTransactionMeta | null;
	version?: TransactionVersion | undefined;
}

export async function getTransactionsFromBlock(connection: Connection, blockNumber: number): Promise<Tx[]> {
	const block = await connection.getBlock(blockNumber, {
		commitment: 'confirmed',
		maxSupportedTransactionVersion: 0,
	});

	if (block === null) {
		console.error(`Failed to fetch block number ${blockNumber}`);
		return [];
	}

	return block.transactions;
}
