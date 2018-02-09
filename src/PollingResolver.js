// Inspired by https://gist.github.com/joepie91/2664c85a744e6bd0629c
function wait(millis) {
	return new Promise((resolve) => setTimeout(resolve, millis));
}

export default class PollingResolver {
	constructor(target, fetcher) {
		this.fetcher = fetcher;
		this.endpoint = target.endpoint;
	}

	resolve(body) {
		return this.baseHandleTask(body.taskId, body.taskStatus, body.data);
	}

	// To check tasks, we bounce back and forth between baseHandleTask and pollTaskStatus.
	handleTask(body) {
		return this.baseHandleTask(body.data.id, body.data.status, body.data.result);
	}

	baseHandleTask(id, status, result) {
		if (!id) {
			// Not a task, ignore.
			return Promise.resolve(result);
		}

		if (status === 'SUCCESS') {
			return Promise.resolve(result || {});
		} else if (status === 'FAILED') {
			// TODO Error code.
			return Promise.reject(new Error('Operation failed.'));
		} else if (status === 'PENDING') {
			return wait(1000).then(() => this.pollTaskStatus(id));
		}

		return Promise.reject(new Error(`Something went horribly wrong while trying to process API response "${JSON.stringify(result)}"`));
	}

	pollTaskStatus(taskId) {
		return this.fetcher(`${this.endpoint}/tasks/${taskId}`)
			.then(data => this.handleTask(data));
	}
};
