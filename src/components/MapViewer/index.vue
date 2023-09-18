<template>
	<div id="map-viewer" ref="map" />
</template>

<script>
import { Loader } from "@googlemaps/js-api-loader";

// 載入 Google Map API
const loaderOpt = {
	apiKey: "",
	version: "weekly",
	language: "zh-TW",
	region: "TW",
	libraries: ["places", "geocoding"],
};

// apiKey
if(!sessionStorage.devMode && process.env.VUE_APP_MAP_KEY != undefined) loaderOpt.apiKey = process.env.VUE_APP_MAP_KEY;
const loader = new Loader(loaderOpt);

export default {
	name: 'MapViewer',
	props: {
		map: {
			required: true,
			type: Object
		}
	},
	data() {
		return { }
	},
	computed: {
		mapProps: {
			get() {
				return this.map;
			},
			set(val) {
				this.$emit('update:map', val);
			}
		}
	},
	watch: { },
	async mounted() {
		// Google Map錯誤處理
		window.gm_authFailure = () => { 
			console.log("Google Map Failure");
			// session.devMode: 時效5分鐘
			sessionStorage.devMode = true;
			sessionStorage.dueTime = new Date().getTime() + (5*60*1000);
			location.reload();
		};

		// 初始化Google Map
		loader.load().then(async() =>{
			await this.initMap();

			// NOTE: 設定路名在KML之上，只有在非開發模式才能載入多圖層
			if(loaderOpt.apiKey.length != 0) {
				// NOTE: 疊上StyledMapType
				const labelsMapType = new google.maps.StyledMapType(
					[
						{
							stylers: [{ visibility: 'off'}]
						}, 
						{
							featureType: "road",
							elementType: 'labels',
							stylers: [{ visibility: 'on' }]
						}
					], 
					{
						name: 'Labels'
					}
				);
				
				this.mapProps.overlayMapTypes.push(labelsMapType);
			}

		}).catch(err => console.log("err: ", err));
	},
	methods: {
		async initMap() {
			// 預設顯示的地點：台北市政府親子劇場
			// const location = {
			// 	lat: 25.0374865, // 經度
			// 	lng: 121.5647688, // 緯度
			// };
			const location = {
				lat: 25.0685406,
				lng: 121.5280918
			}

			// 建立地圖
			// console.log("initMap");
			this.mapProps = new google.maps.Map(this.$refs.map, {
				center: location, // 中心點座標
				zoom: 20, // 1-20，數字愈大，地圖愈細：1是世界地圖，20就會到街道
				maxZoom: 24,
				minZoom: 13,
				/*
					roadmap 顯示默認道路地圖視圖。
					satellite 顯示 Google 地球衛星圖像。
					hybrid 顯示正常和衛星視圖的混合。
					terrain 顯示基於地形信息的物理地圖。
				*/
				// mapTypeId: "roadmap",
				fullscreenControl: false,
				mapTypeControl: false,
				streetViewControl: false,
				rotateControl: false,
				tilt: 0,
				styles: [
					{
						stylers: [{ visibility: "on" }],
					},
					{
						elementType: "geometry",
						stylers: [{ color: "#f5f5f5" }]
					},
					{
						elementType: "labels.text.fill",
						stylers: [{ color: "#616161" }]
					},
					{
						elementType: "labels.text.stroke",
						stylers: [{ color: "#f5f5f5" }]
					},
					{
						featureType: "administrative",
						elementType: "all",
						stylers: [{ visibility: "off" }]
					},
					{
						featureType: "poi",
						elementType: "all",
						stylers: [{ visibility: "off" }],
					},
					{
						featureType: "road",
						elementType: "geometry",
						stylers: [{ color: "#FFFFFF" }]
					},
					{
						featureType: "road.arterial",
						elementType: "labels.text.fill",
						stylers: [{ color: "#757575" }]
					},
					{
						featureType: "road.highway",
						elementType: "geometry",
						stylers: [{ color: "#DADADA" }]
					},
					{
						featureType: "road.highway",
						elementType: "labels.text.fill",
						stylers: [{ color: "#616161" }]
					},
					{
						featureType: "road.local",
						elementType: "labels.text.fill",
						stylers: [{ color: "#9E9E9E" }]
					},
					{
						featureType: "transit",
						elementType: "all",
						stylers: [{ visibility: "off" }],
					},
					{
						featureType: "road",
						elementType: "labels",
						stylers: [{ visibility: "off" }]
					},
					{
						featureType: "water",
						elementType: "geometry",
						stylers: [{ color: "#C9C9C9" }]
					},
					{
						featureType: "water",
						elementType: "labels.text.fill",
						stylers: [{ color: "#9E9E9E" }]
					}
				],
			});
		},
	}
}
</script>

<style lang="sass">
#map-viewer
	overflow: hidden
	background: none !important
	// position: absolute
	// height: calc(100vh - 50px)
	min-height: 300px
	height: 100%
	// width: 100vw
	[role="region"] > div:first-child > div:first-child
		z-index: 120 !important
	.gm-style-iw.gm-style-iw-c
		table, tr, td
			font-family: 'Noto Sans TC', '微軟正黑體', 'Microsoft JhengHei', sans-serif
			border-collapse: collapse !important
			border: none !important
			padding: 5px
</style>