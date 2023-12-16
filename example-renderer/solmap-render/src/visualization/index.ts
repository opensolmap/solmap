import { Connection } from '@solana/web3.js';
import { Tx, getTransactionsFromBlock } from './fetching';
import { drawTxSizesVariableGrid } from './render';

export async function generateSolmapImage(rpc_url: string, solmapNum: number): Promise<any> {
	const connection = new Connection(rpc_url, 'confirmed');

	const transactions = await getTransactionsFromBlock(connection, solmapNum * 1000);

	const sizes = txSizes(transactions || []);
	return drawTxSizesVariableGrid(sizes);
}

function txSizes(transactions: Tx[]): number[] {
	return transactions.map((tx) => txSize(tx));
}

function txSize(tx: Tx) {
	const encoder = new TextEncoder();
	const transactionSize = encoder.encode(JSON.stringify(tx.transaction)).length;

	return transactionSize;
}
