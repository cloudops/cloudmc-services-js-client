/**
 * The CloudMC API JavaScript client library.
 */
(function () {
	'use strict';

	// Ewww, compatibility 💩 (enables use in node and browser environments)
	require('es6-promise').polyfill();
	require('isomorphic-fetch');

	function buildHeadersWithApiKey(apiKey) {
		const headers = new Headers();
		headers.set('MC-Api-Key', apiKey);
		headers.set('Content-Type', 'application/json');
		return headers;
	}

	function baseDoApiCall(target) {
		// TODO Is there a way to do this destructuring in the arg list while also keeping a reference to target?
		const { method, endpoint, apiKey, serviceCode, environmentName, entityType, body, id, operation } = target;
		const headers = buildHeadersWithApiKey(apiKey);
		const idPart = id ? ('/' + id) : '';
		const operationPart = operation ? ('?operation=' + operation) : '';
		return fetch(`${endpoint}/services/${serviceCode}/${environmentName}/${entityType}${idPart}${operationPart}`, { headers, method, body })
			// TODO handle tasks
			.then(res => res.json().data);
	}

	function doApiCall(target, extensions) {
		return baseDoApiCall(Object.assign({}, target, extensions));
	}

	function createFn(target) {
		return body => doApiCall(target, { method: 'POST', body });
	}

	function deleteFn(target) {
		return (id, body) => doApiCall(target, { method: 'DELETE', id, body });
	}

	function updateFn(target) {
		return (id, body) => doApiCall(target, { method: 'PUT', id, body });
	}

	function getFn(target) {
		return id => doApiCall(target, { method: 'GET', id });
	}

	function listFn(target) {
		// TODO: fetch options
		return options => doApiCall(target, { method: 'GET' });
	}

	function executeFn(target, operation) {
		// TODO: if id is an object, consider it a general operation with a body.
		return (id, body) => doApiCall(target, { method: 'POST', id, body, operation });
	}

	const operationFns = {
		create: createFn,
		delete: deleteFn,
		update: updateFn,
		list: listFn,
		get: getFn,
	};

	const operationHandler = {
		get: function (target, operation) {
			if (operation in target) {
				return target[operation];
			} else if (operation in operationFns) {
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

	module.exports = function (endpoint, apiKey) {
		return (serviceCode, environmentName) => new Proxy({ endpoint, apiKey, serviceCode, environmentName }, serviceEntityHandler);
	};
}());
