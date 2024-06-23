<template>
	<div class="hole-map" v-loading="loading">
		<div id="map" ref="map" />
		<div class="header-bar">
			<h2 class="case-title">孔蓋地圖</h2>
			<div class="filter-container">
				<div class="filter-item">
					<el-input v-model="listQuery.filterId" placeholder="請輸入">
						<span slot="prepend">孔蓋編號</span>
					</el-input>
				</div>
				<el-button class="filter-item" type="primary" size="small" icon="el-icon-search" @click="search()">搜尋</el-button>

				<el-dropdown class="filter-item" style="margin-left: 60px;" @command="(command) => handleCommand(command, 'location')">
					<el-button type="info" size="small" plain round>
						<span v-if="command.location == 'none'">位於</span>
						<span v-else>{{ command.location }}</span>
						<i class="el-icon-arrow-down el-icon--right" />
					</el-button>
					<el-dropdown-menu slot="dropdown">
						<el-dropdown-item command="none">無</el-dropdown-item>
						<el-dropdown-item command="車道">車道</el-dropdown-item>
						<el-dropdown-item command="人行道">人行道</el-dropdown-item>
						<el-dropdown-item command="後巷">後巷</el-dropdown-item>
					</el-dropdown-menu>
				</el-dropdown>

				<el-dropdown class="filter-item" @command="(command) => handleCommand(command, 'pattern')">
					<el-button type="info" size="small" plain round>
						<span v-if="command.pattern == 'none'">花紋</span>
						<span v-else>{{ command.pattern }}</span>
						<i class="el-icon-arrow-down el-icon--right" />
					</el-button>
					<el-dropdown-menu slot="dropdown">
						<el-dropdown-item command="none">無</el-dropdown-item>
						<el-dropdown-item command="正常">正常</el-dropdown-item>
						<el-dropdown-item command="行動值">行動值</el-dropdown-item>
						<el-dropdown-item command="警戒值">警戒值</el-dropdown-item>
						<!-- <el-dropdown-item command="魚與樹">魚與樹</el-dropdown-item>
						<el-dropdown-item command="菱形">菱形</el-dropdown-item>
						<el-dropdown-item command="其他">其他</el-dropdown-item> -->
					</el-dropdown-menu>
				</el-dropdown>

				<el-dropdown class="filter-item" @command="(command) => handleCommand(command, 'frame')">
					<el-button type="info" size="small" plain round>
						<span v-if="command.frame == 'none'">框座</span>
						<span v-else>{{ command.frame }}</span>
						<i class="el-icon-arrow-down el-icon--right" />
					</el-button>
					<el-dropdown-menu slot="dropdown">
						<el-dropdown-item command="none">無</el-dropdown-item>
						<el-dropdown-item command="正常">正常</el-dropdown-item>
						<el-dropdown-item command="不正常">不正常</el-dropdown-item>
					</el-dropdown-menu>
				</el-dropdown>
			</div>
		</div>

		<transition name="el-zoom-in-center">
			<el-card v-if="Object.keys(holeSpecInfo).length > 0" class="info-box bottom">
				<el-button type="text" style="float: right;" @click="holeSpecInfo = {}"><i class="el-icon-close" style="font-size: 20px;" /></el-button>
				<el-row :gutter="24" type="flex" align="center" justify="center" style="height: 100%; padding: 5px 2px;">
					<el-col :span="10">
						<el-image :src="`https://storage.googleapis.com/adm_hole/holeImg/${holeSpecInfo.strId}.jpg`" fit="cover" @click="showImgViewer = true">
							<template #error>
								<el-image src="/assets/icon/icon_manhole.png" fit="cover" @click="showImgViewer = true" />
							</template>
						</el-image>
					</el-col>
					<el-col :span="14" class="hole-info">
						<el-row v-for="(name, key) in headers.holeInfo" :gutter="3" :key="key">
							<template v-if="holeSpecInfo[key] && holeSpecInfo[key].length != 0">
								<el-col :span="6" class="hole-title">{{ name }}: </el-col>
								<el-col :span="18">{{ holeSpecInfo[key] }}</el-col>
							</template>
						</el-row>
						<el-row :gutter="20">
							<el-col :span="8" class="icon-info">
								<div>花紋</div>
								<el-tag type="success">{{ holeSpecInfo.pattern || "正常" }}</el-tag>
							</el-col>
							<el-col :span="8" class="icon-info">
								<div>框座</div>
								<el-tag>{{ holeSpecInfo.frame || "良好" }}</el-tag>
							</el-col>
							<el-col :span="8" class="icon-info">
								<div>歷程</div>
								<el-link :href="`https://ssowebmis.sew.gov.taipei/websew/HP/hHis.aspx?hid=${holeSpecInfo.strId}`" target="_blank"  :underline="false">
									<el-tag type="warning"><i class="el-icon-document" /></el-tag>
								</el-link>
							</el-col>
						</el-row>
					</el-col>
				</el-row>
			</el-card>
		</transition>

		<el-image-viewer
			v-if="showImgViewer"
			class="img-preview"
			:on-close="() => { showImgViewer = false; }"
			:url-list="imgUrls"
		/>
	</div>
</template>

<script>
import { Loader } from "@googlemaps/js-api-loader";
import moment from "moment";
import { getHoleGeoJSON } from "@/api/sewerageSys";
import ElImageViewer from 'element-ui/packages/image/src/image-viewer';

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
	name: "holeMap",
	components: { ElImageViewer },
	data() {
		return {
			loading: false,
			showImgViewer: false,
			screenWidth: window.innerWidth,
			currId: null,
			listQuery: {
				filterId: "",
			},
			imgUrls: [],
			infoWindow: null,
			holeSpecInfo: {},
			geoJSONFilter: {},
			command: {
				location: "none",
				pattern: "none",
				frame: "none"
			},
			headers: {
				holeInfo: {
					strId: "孔蓋編號",
					dist: "行政區",
					address: "地址",
					location: "位於"
				}
			}
		};
	},
	created() {
		this.geoJSON = {};
		this.dataLayer = { district: null, mask: null };
	},
	async mounted() {
		// this.loading = true;
		// Google Map錯誤處理
		window.gm_authFailure = () => { 
			console.log("Google Map Failure");
			// session.devMode: 時效5分鐘
			sessionStorage.devMode = true;
			sessionStorage.dueTime = new Date().getTime() + (5*60*1000);
			location.reload();
		};

		// 初始化Google Map
		loader.load().then(async() => {
			this.initMap().then(() => this.getList());
		}).catch(err => console.log("err: ", err));
	},
	methods: {
		// init google map
		async initMap() {
			return new Promise(resolve => {
				// console.log("initMap");
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
				this.map = new google.maps.Map(this.$refs.map, {
					center: location, // 中心點座標
					zoom: 14, // 1-20，數字愈大，地圖愈細：1是世界地圖，20就會到街道
					maxZoom: 24,
					minZoom: 12,
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
					this.map.overlayMapTypes.push(labelsMapType);
				}

				this.infoWindow = new google.maps.InfoWindow({ pixelOffset: new google.maps.Size(0, -10) });
				// this.infoWindow.addListener('domready', () => {
				// 	const infoScrnFullBtn = this.$el.querySelector("#map #info-scrn-full-btn");
				// 	if(infoScrnFullBtn) {
				// 		const clickHandle = infoScrnFullBtn.addEventListener("click", () => { 
				// 			this.showImgViewer = true;
				// 			infoScrnFullBtn.removeEventListener("click", clickHandle);
				// 		});
				// 	}
				// });

				// 載入區域GeoJson
				this.dataLayer.mask = new google.maps.Data({ map: this.map });
				this.dataLayer.mask.loadGeoJson(`/assets/json/Taiwan.geojson?t=${Date.now()}`);
				this.dataLayer.mask.setStyle({
					strokeColor: "#000000",
					strokeWeight: 0,
					strokeOpacity: 1,
					fillColor: "#000000",
					fillOpacity: 0.7,
					zIndex: 0
				});

				// this.dataLayer.district = new google.maps.Data({ map: this.map });
				// this.dataLayer.district.loadGeoJson(`/assets/json/district.geojson?t=${Date.now()}`);

				this.map.data.setStyle({
					icon: { 
						url: "/assets/icon/icon_manhole.png",
						scaledSize: new google.maps.Size(40, 40),
					},
				});

				this.map.data.addListener('mouseover', (event) => {
					this.showHoleContent(event.feature, event.latLng);
				});
				this.map.data.addListener('mouseout', (event) => {
					this.infoWindow.close();
				});
				this.map.data.addListener('click', (event) => {
					this.showHoleDetail(event.feature);
				});

				resolve();
			})
		},
		getGeoJSONFilter() {
			this.geoJSONFilter = { features: [] };
			if(this.geoJSON != undefined) {
				this.geoJSONFilter = JSON.parse(JSON.stringify(this.geoJSON));

				this.geoJSONFilter.features = this.geoJSONFilter.features.filter(feature => {
					return Object.keys(this.command).reduce((acc, cur) => {
						return acc && (this.command[cur] == 'none' || feature.properties[cur] == this.command[cur]);
					}, true);
				});
			}
		},
		async getList() {
			this.loading = true;
			this.clearAll();

			// 載入缺失
			await getHoleGeoJSON().then(async (response) => {
				if(response.data.geoJSON.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.geoJSON = JSON.parse(response.data.geoJSON);
					// console.log(this.geoJSON.case);
					// this.getGeoJSONFilter();
					this.getGeoJSONFilter();
					this.map.data.addGeoJson(this.geoJSONFilter);
				}
				
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		handleCommand(command, key) {
			// console.log(command, key);
			this.command[key] = command;
			this.clearAll();
			this.getGeoJSONFilter(key);
			this.map.data.addGeoJson(this.geoJSONFilter);
		},
		async search() {
			this.loading = true;
			await this.focusMap();
			this.loading = false;
		},
		async focusMap() {
			return new Promise(resolve => {
				// console.log("focusMap");
				// this.map.data.revertStyle();

				if(!this.listQuery.filterId || this.listQuery.filterId.length == 0) resolve();
				else {
					const holeSpec = this.geoJSONFilter.features.filter(feature => (feature.properties.strId == this.listQuery.filterId))[0];
					if(holeSpec == undefined ) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
						resolve();
					} else {
						// this.map.data.forEach(features => { 
						// 	if(features.getProperty("strId") == this.listQuery.filterId) {
						// 		this.map.data.overrideStyle(features, {
						// 			label: "Here"
						// 		});
						// 	}
						// })

						this.map.setCenter({ lat: holeSpec.geometry.coordinates[1], lng: holeSpec.geometry.coordinates[0] });
						const zoom = this.map.getZoom();
						this.map.setZoom(zoom < 21 ? 21 : zoom);
						this.showHoleContent(holeSpec.properties, { lat: holeSpec.geometry.coordinates[1], lng: holeSpec.geometry.coordinates[0] });
						resolve();
					} 
			}
			})
		},
		showHoleContent(props, position) {
			const isFeature = google.maps.Data.Feature.prototype.isPrototypeOf(props);
			this.currId = isFeature ? props.getProperty("strId") : props.strId;
			// console.log(props, isFeature

			let contentText = `<div style="width: 400px;">`;
			for(const key in this.headers.holeInfo) {
				if(props[key] || (isFeature && props.getProperty(key))) {
					const prop = isFeature ? props.getProperty(key) : props[key];
					contentText += `<div class="el-row" style="margin-bottom: 4px">`;
					contentText += `<div class="el-col el-col-8" style="padding-left: 5px; font-size: 18px; line-height: 18px;">${this.headers.holeInfo[key]}</div>`;
					contentText += `<div class="el-col el-col-16" style="font-size: 18px; line-height: 18px;">${prop}</div>`;
					contentText += `</div>`;
				}
			}

			contentText += `</div>`;
			// console.log(contentText);
			this.infoWindow.setContent(contentText);
			this.infoWindow.setOptions({ pixelOffset: new google.maps.Size(0, -10)});
			this.infoWindow.setPosition(position);

			this.infoWindow.open(this.map);
		},
		clearAll() {
			this.infoWindow.close();
			this.map.data.forEach(feature => this.map.data.remove(feature));
		},
		showHoleDetail(feature) {
			this.caseSpecInfo = {};
			// this.setHoleImgViewer({ imgUrls: [feature.getProperty("ImgZoomOut"), feature.getProperty("ImgZoomIn")] });

			this.$nextTick(() => {
				this.holeSpecInfo = {
					strId: feature.getProperty("strId"),
					pattern: feature.getProperty("pattern"),
					frame: feature.getProperty("frame"),
					imgUrl: feature.getProperty("imgUrl")
				};

				this.imgUrls = [`https://storage.googleapis.com/adm_hole/holeImg/${this.holeSpecInfo.strId}.jpg`];

				for (const key in this.headers.holeInfo) {
					// console.log(feature);
					if (feature.getProperty(key)) {
						this.holeSpecInfo[key] = feature.getProperty(key);
					}
				}
			})
		},
		setHoleImgViewer({ imgUrls, isOpen = false }) {
			if (imgUrls != null) this.imgUrls = imgUrls;
			this.showImgViewer = isOpen;
		},
		formatter(row, column) {
			if (Number(row[column.property])) return row[column.property].toLocaleString();
			else return row[column.property] || "-";
		},
		formatTime(time) {
			return moment(time).format("YYYY-MM-DD");
		}
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.hole-map
	position: relative
	height: 100%
	width: 100%
	.header-bar
		position: absolute
		top: 0
		z-index: 1
		padding-left: 10px
		.case-title
			text-shadow: 0px 0px 5px white
			text-stroke: 0.6px white
			-webkit-text-stroke: 0.6px white
		.filter-item.filter
			position: relative
			margin: -8px 10px auto 5px
			& > div:first-child
				display: inline-block
				width: auto
				padding: 0 5px
				color: #bbb
				font-size: 12px
	.img-preview
		width: 100%
		.el-image-viewer__mask
			opacity: 0.7
		.el-icon-circle-close
			color:  #FFF
	.info-box
		position: absolute
		width: 280px
		background-color: rgba(white, 0.7)
		z-index: 1
		&.bottom
			width: 40%
			min-width: 600px
			max-width: 640px
			height: 20%
			min-height: 200px
			max-height: 240px
			bottom: 15px
			left: 50%
			transform: translateX(-50%)
			border-radius: 10px
			background-color: rgba(white, 0.95)
			.el-card__body
				overflow: hidden
				padding: 2px
				height: 100%
				// margin-left: -5px
				.el-image
					height: 101%
					cursor: pointer
				.hole-info
					margin: auto
					& > *
						font-size: 14px
					.hole-title
						color: #444
						margin-bottom: 2px
					.icon-info
						display: flex
						flex-direction: column
						align-items: center
						color: #909399
						font-size: 12px
						.el-link, .el-link--inner
							width: 100%
						.el-tag
							width: 100%
							height: 40px
							text-align: center
							font-size: 20px
							padding: 4px 0px
							margin-top: 2px
	#map
		overflow: hidden
		background: none !important
		// position: absolute
		height: calc(100vh - 50px)
		// width: 100vw
		[role="region"] > div:first-child > div:first-child
			z-index: 120 !important
		.gm-style-iw.gm-style-iw-c
			table, tr, td
				font-family: 'Noto Sans TC', '微軟正黑體', 'Microsoft JhengHei', sans-serif
				border-collapse: collapse !important
				border: none !important
				padding: 5px
			.img
				width: 100%
				object-fit: scale-down
				&.hide-img
					display: none
			.info-btn
				position: absolute
				right: 30px
				&.del
					top: 25px
					background-color: rgba(#EF5350, 0.3)
					border-color: #EF5350
				&.scrn-full
					padding: 0
					bottom: 25px
					background-color: rgba( #FFF, 0.3)
					border-color:  #FFF
				& .btn-text
					position: absolute
					top: 50%
					left: 50%
					transform: translate(-50%, -50%)
					font-size: 14px
					line-height: 20px
					color: #EF5350
					&.el-icon-full-screen
						color:  #FFF
						line-height: 30px
						font-size: 20px
						width: 30px
</style>