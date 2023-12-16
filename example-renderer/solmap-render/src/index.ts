import { Router } from 'itty-router';
import { generateSolmapImage } from './visualization';

export interface Env {
	RPC_QUICKNODE_URL: string;
}

const router = Router();
router.get('/v1/block/:num', async ({ params }, env) => {
	const rpc_url = env.RPC_QUICKNODE_URL || 'https://api.mainnet-beta.solana.com';
	const buffer = await generateSolmapImage(rpc_url, parseInt(params.num));

	return new Response(buffer, {
		headers: {
			'content-type': 'image/png',
		},
	});
});
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		return await router.handle(request, env);
	},
};
