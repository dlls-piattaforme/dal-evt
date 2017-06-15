'use strict';

/**
 * @ngdoc overview
 * @name evtviewer
 * @description
 * # evtviewer
 *
 * Main module of the application.
 */
angular
	.module('evtviewer', [
// Needed for mobile (temporarily deactivated)
//		'ngAnimate',
//		'ngCookies',
//		'ngMessages',
//		'ngResource',
//		'ngSanitize',
//		'ngTouch',
//		'templates-main',
		'ngRoute',
		'xml',
		'prettyXml',
		'infinite-scroll',
		'evtviewer.core',
		'evtviewer.communication',
		'evtviewer.dataHandler',
		'evtviewer.interface',
		'evtviewer.box',
		'evtviewer.select',
		'evtviewer.buttonSwitch',
//		'evtviewer.mobile',
		'evtviewer.popover',
		'evtviewer.namedEntity',
		'evtviewer.criticalApparatusEntry',
		'evtviewer.reading',
		'evtviewer.dialog',
		'evtviewer.bibliography',
		'evtviewer.reference',
		'evtviewer.list',
		'evtviewer.tabsContainer',
		'evtviewer.UItools'
	]);