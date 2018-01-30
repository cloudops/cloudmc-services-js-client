export default class ApiKeyAuthenticator {
	constructor(target) {
		if (!target.apiKey) {
			throw new Error('No API key provided in options!');
		}
		this.apiKey = target.apiKey;
	}

	authenticate(headers) {
		headers.set('MC-Api-Key', this.apiKey);
	}
};
