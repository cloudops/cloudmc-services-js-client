/**
 * The CloudMC API JavaScript client library.
 */

import 'isomorphic-fetch';

import PollingResolver from './PollingResolver';
import ApiKeyAuthenticator from './apiKeyAuthenticator';

function buildAuthenticatedHeaders(authenticator) {
	const headers = new Headers();
	authenticator.authenticate(headers);
	headers.set('Content-Type', 'application/json');
	return headers;
}

function baseFetcher(authenticator) {
	return (url, options) => fetch(url, Object.assign({}, options, { headers: buildAuthenticatedHeaders(authenticator) }))
		.then(res => res.json());
}

function handleNewTask(resolver, taskResponse) {
	// Resolvers return Promises.
	return resolver.resolve(taskResponse);
}

function baseDoApiCall({ method, endpoint, serviceCode, environmentName, entityType, body, id, operation, authenticator, resolver }) {
	const idPart = id ? ('/' + id) : '';
	const operationPart = operation ? ('?operation=' + operation) : '';
	const fetcher = baseFetcher(authenticator);
	return fetcher(`${endpoint}/services/${serviceCode}/${environmentName}/${entityType}${idPart}${operationPart}`, { method, body })
		.then(data => handleNewTask(resolver, data));
}

function doApiCall(target, extensions) {
	return baseDoApiCall(Object.assign({}, target, extensions));
}

function executeFn(target, operation) {
	// TODO: if id is an object, consider it a general operation with a body.
	return (id, body) => doApiCall(target, { method: 'POST', id, body, operation });
}

const operationFns = {
	create: target => body => doApiCall(target, { method: 'POST', body }),
	delete: target => (id, body) => doApiCall(target, { method: 'DELETE', id, body }),
	update: target => (id, body) => doApiCall(target, { method: 'PUT', id, body }),
	// TODO support fetch options
	list:   target => options => doApiCall(target, { method: 'GET' }),
	get:    target => id => doApiCall(target, { method: 'GET', id }),
};

const operationHandler = {
	get: function (target, operation) {
		if (operation in operationFns) {
			return operationFns[operation](target);
		} else {
			return executeFn(target, operation);
		}
	}
};

const serviceEntityHandler = {
	get: function (target, entityType) {
		return () => new Proxy(Object.assign({}, target, { entityType }), operationHandler);
	}
};

const defaultOptions = {
	resolver: PollingResolver,
	authenticator: ApiKeyAuthenticator,
};

// TODO name this better
function getOptions(target, options) {
	const newOptions = {};
	if (!options) {
		options = {};
	}

	const authenticatorClass = options.authenticator || defaultOptions.authenticator;
	const resolverClass = options.resolver || defaultOptions.resolver;

	newOptions.authenticator = new authenticatorClass(target);
	newOptions.resolver = new resolverClass(target, baseFetcher(newOptions.authenticator));

	return newOptions;
}

export default function clientFactory(endpoint, options) {
	const target = Object.assign({ endpoint }, options);
	options = getOptions(target, options);
	return (serviceCode, environmentName) => new Proxy(Object.assign({ endpoint, serviceCode, environmentName }, options), serviceEntityHandler);
};
