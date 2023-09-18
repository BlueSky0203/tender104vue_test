<template>
	<div class="case-mark" v-loading="loading"> 
		<div class="header-bar">
			<h2 class="route-title">缺失標記</h2>
			<div class="filter-container">
				<span class="filter-item" style="display: inline-flex">
					<el-button :type="showLayerAttach ? 'primary' : 'info'" @click="showLayerAttach = !showLayerAttach">路線圖層</el-button>
					<el-card v-if="showLayerAttach" :body-style="{ padding: '0 5px', backgroundColor: 'rgba(255, 255, 255, 0.5)' }">
						<div class="filter-item">
							<div class="select-district el-input el-input--medium el-input-group el-input-group--prepend">
								<div class="el-input-group__prepend">
									<span>行政區</span>
								</div>
								<el-select class="district-select" v-model="listQuery.inspectRoundZipCode">
									<el-option v-for="(info, zip) in options.districtList" :key="zip" :label="info.name" :value="Number(zip)" />
								</el-select>
							</div>
						</div>
						<div class="filter-item">
							<div class="select-district el-input el-input--medium el-input-group el-input-group--prepend">
								<div class="el-input-group__prepend">
									<span>週期</span>
								</div>
								<el-select class="district-select" v-model="listQuery.inspectRound">
									<el-option v-for="(name, id) in options.inspectRound" :key="id" :label="name" :value="Number(id)" />
								</el-select>
							</div>
						</div>
						<el-button-group>
							<el-button type="primary" size="small" @click="getRouteList()">載入</el-button>
							<el-button type="success" size="small" @click="intersectRoute()">比對</el-button>
							<el-button type="info" size="small" @click="clearRouteLayer()">清空</el-button>
						</el-button-group>
					</el-card>
				</span>
				<br>
				<span class="filter-item">
					<el-input v-model="listQuery.inspectId" placeholder="請輸入" size="medium" style="width: 254px;">
						<span slot="prepend">巡查Id</span>
					</el-input>
				</span>
				<br>
				<span class="filter-item">
					<el-input v-model="listQuery.caseInspectId" placeholder="請輸入" size="medium" style="width: 254px;">
						<span slot="prepend">前次巡查Id</span>
					</el-input>
				</span>
				<el-button class="filter-item" type="success" icon="el-icon-download" size="small" @click="getList()">載入</el-button>
				<br>
				<span class="filter-item">
					<el-input v-model="listQuery.caseId" placeholder="請輸入" size="medium" style="width: 254px;" :disabled="Object.keys(caseGeoJson.caseNow).length == 0">
						<span slot="prepend">缺失Id</span>
					</el-input>
				</span>
				<el-button class="filter-item" type="primary" icon="el-icon-search" size="small" :disabled="Object.keys(caseGeoJson.caseNow).length == 0" @click="search()">搜尋</el-button>
			</div>
		</div>
		<el-row>
			<el-col ref="leftPanel" :span="8" :style="panelStyle.leftPanel">
				<div id="map" ref="map" />
				<div class="btn-map">
					<!-- <div ref="compass" class="btn-action btn-compass" style="transform: rotate(0deg)" @click="setHeading(0)" /> -->
					<el-button class="btn-action btn-target" plain icon="el-icon-aim" @click="setMarkerPosition()" />
				</div>
			</el-col>
			<el-col ref="rightPanel" class="right-panel" :span="16" :style="panelStyle.rightPanel" >
				<div class="touch-div" ref="splitLine" @click="openPanorama()">
					<span />
					<span />
				</div>
				<panorama-view ref="panoramaView" :loading.sync="loading" :isUpload.sync="isUpload" :listQuery="listQuery" :panoramaInfo.sync="panoramaInfo" :options="options" :caseGeoJson="caseGeoJson" @showPanoramaLayer="showPanoramaLayer" @setMarkerPosition="setMarkerPosition" @setHeading="setHeading" @addMarker="addMarker" @clearMarker="clearMarker" @hightLight="hightLight" @setCaseImgViewer="setCaseImgViewer" @ @uploadCase="uploadCase" />
			</el-col>
		</el-row> 

		<el-image-viewer
			v-if="showImgViewer"
			class="img-preview"
			:on-close="() => { showImgViewer = false; openPanorama(false, true); }"
			:url-list="imgUrls"
		/>
	</div>
</template>

<script>
import { Loader } from "@googlemaps/js-api-loader";
import moment from 'moment';
import { getPanoramaJson, getInspectionCaseGeoJson, uploadInspectionCase } from "@/api/inspection";
import { getInspectionRoute } from "@/api/inspection";
import data2blob from '@/utils/data2blob.js';
import PanoramaView from '@/components/PanoramaView';
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
	name: "caseMark",
	components: { PanoramaView, ElImageViewer },
	data() {
		return {
			loading: false,
			init: true,
			isUpload: false,
			showLayerAttach: false,
			showImgViewer: false,
			imgUrls: [],
			map: null,
			inspectIdNow: null,
			clientStartX: 0,
			caseGeoJson: {
				caseNow: {}, 
				casePrev: {}
			},
			polyLine: [],
			markersTemp: {},
			pointCurr: null,
			pickerOptions: {
				firstDayOfWeek: 1,
				shortcuts: [
					{
						text: "今日",
						onClick(picker) {
							const date = moment();
							picker.$emit("pick", date);
						},
					},
					{
						text: "昨日",
						onClick(picker) {
							const date = moment().subtract(1, "d");
							picker.$emit("pick", date);
						}
					},
					{
						text: "前日",
						onClick(picker) {
							const date = moment().subtract(2, "d");
							picker.$emit("pick", date);
						}
					}
				],
				disabledDate(date) {
					return moment(date).valueOf() >= moment().endOf("d").valueOf();
				},
			},
			searchDate: moment().startOf("d"),
			searchRange: "",
			screenWidth: 0,
			listQuery: {
				inspectId: "",
				caseInspectId: "",
				caseId: ""
			},
			panoramaInfo: {
				data: [],
				sceneSetting: {}, 
				streetViewList: {}
			},
			options: {
				districtList: {
					100: {
						name: "中正區"
					},
					103: {
						name: "大同區"
					},
					104: {
						name: "中山區"
					},
					105: {
						name: "松山區"
					},
					106: {
						name: "大安區"
					},
					108: {
						name: "萬華區"
					},
					110: {
						name: "信義區"
					},
					111: {
						name: "士林區"
					},
					112: {
						name: "北投區"
					},
					114: {
						name: "內湖區"
					},
					115: {
						name: "南港區"
					},
					116: {
						name: "文山區"
					},
				},
				inspectRound: {
					0: "全部",
					1: "週期一",
					2: "週期二",
					3: "週期三",
					4: "週期四",
					5: "週期五",
					6: "週期六",
					7: "週期七"
				},
				imgTypeMap: {
					"imgZoomIn": "近照",
					"imgZoomOut": "遠照"
				},
				caseColorMap: [
					{
						index: 0,
						name: ["龜裂"],
						color: "#B71C1C"
					},
					{
						index: 1,
						name: ["縱橫裂縫", "縱向及橫向裂縫", "塊狀裂縫"],
						color: "#009688"
					},
					{
						index: 2,
						name: ["坑洞", "人孔高差", "薄層剝離", "人手孔缺失"],
						color: "#FF9800"
					},
					{
						index: 3,
						name: ["車轍", "隆起與凹陷", "推擠", "波浪狀鋪面"],
						color: "#00BCD4"
					},
					{
						index: 4,
						name: ["補綻", "管線回填", "車道與路肩分離"],
						color: "#673AB7"
					},
					{
						index: 5,
						name: ["骨材剝落", "滑溜裂縫"],
						color: "#8BC34A"
					},
					{	
						index: 6,
						name: ["其他"],
						color: "#607D8B"
					}
				],
				caseTypeMap: {
					15: "坑洞",
					29: "縱向及橫向裂縫",
					16: "龜裂",
					32: "車轍",
					18: "隆起與凹陷",
					34: "人手孔缺失(不列入PCI)",
					51: "薄層剝離",
					21: "其他(不列入PCI)",
					50: "塊狀裂縫",
					53: "推擠",
					65: "補綻及管線回填",
					54: "冒油",
					55: "波浪狀鋪面",
					56: "車道與路肩分離",
					49: "滑溜裂縫",
					66: "骨材剝落",
					58: "人孔高差(只列入PCI)"
				},
				caseTypeMapOrder: [ 15, 29, 16, 32, 18, 34, 51, 21, 50, 53, 65, 54, 55, 56, 49, 66, 58 ],
				caseLevelMap: {
					1: "輕",
					2: "中",
					3: "重"
				},
				roadDir: {
					// 0: "無",
					1: "順向",
					2: "逆向"
				}
			},
		};
	},
	computed: {	
		panelStyle() {
			return {
				leftPanel: (this.panoramaInfo.streetViewList.length >= 0) ? "position: relative; width: 25%;" : "position: relative; width: 100%;",
				rightPanel: (this.panoramaInfo.streetViewList.length >= 0) ?"position: relative; width: 75%;" : "position: relative; width: 0%;"
			}
		}
	},
	created() {
		this.dataLayer = { caseNow: {}, casePrev: {}, route: {} };

		// Google Map錯誤處理
		window.gm_authFailure = () => { 
			console.log("Google Map Failure");
			// session.devMode: 時效5分鐘
			sessionStorage.devMode = true;
			sessionStorage.dueTime = new Date().getTime() + (5*60*1000);
			location.reload();
		};

		// 初始化Google Map
		loader.load().then(async () => {
			await this.initMap();
			if (this.$route.query.inspectId || this.$route.query.inspectId && this.$route.query.caseInspectId) {
				this.listQuery.inspectId = this.$route.query.inspectId;
				this.listQuery.caseInspectId = this.$route.query.caseInspectId;
				this.getList();
			}
		}).catch(err => console.log("err: ", err));
	},
	mounted() { 
		this.leftPanel = this.$refs.leftPanel.$el;
		this.rightPanel = this.$refs.rightPanel.$el;
		this.screenWidth = this.leftPanel.offsetWidth + this.rightPanel.offsetWidth;
		this.clientStartX = this.screenWidth;
		const splitLine = this.$refs.splitLine;

		splitLine.onmousedown = e => {
			// console.log(e);
			this.screenWidth = this.leftPanel.offsetWidth + this.rightPanel.offsetWidth;
			this.clientStartX = e.clientX;
			e.preventDefault();

			document.onmousemove = e => { this.moveHandle(e.clientX); };

			document.onmouseup = e => {
				document.onmouseup = null;
				document.onmousemove = null;
			};
		};
	},
	methods: {
		// init google map
		async initMap() {
			return new Promise(resolve => {
				// 預設顯示的地點：台北市政府親子劇場
				const location = {
					lat: 25.0374865, // 經度
					lng: 121.5647688, // 緯度
				};

				// 建立地圖
				this.map = new google.maps.Map(this.$refs.map, {
					center: location, // 中心點座標
					zoom: 13, // 1-20，數字愈大，地圖愈細：1是世界地圖，20就會到街道
					minZoom: 13,
					// maxZoom: 19,
					/*
						roadmap 顯示默認道路地圖視圖。
						satellite 顯示 Google 地球衛星圖像。
						hybrid 顯示正常和衛星視圖的混合。
						terrain 顯示基於地形信息的物理地圖。
					*/
					// mapTypeId: "satellite",
					fullscreenControl: false,
					mapTypeControl: false,
					streetViewControl: false,
					rotateControl: false,
					heading: 0,
					tilt: 0,
					mapId: process.env.VUE_APP_MAP_ID,
					styles: [
						{
							stylers: [{ visibility: "on" }],
						},
						{
							featureType: "poi",
							elementType: "all",
							stylers: [{ visibility: "off" }],
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

				// 缺失
				this.dataLayer.caseNow = new google.maps.Data({ map: this.map });
				this.setDataLayer(this.dataLayer.caseNow);
				this.dataLayer.casePrev = new google.maps.Data({ map: this.map });
				this.setDataLayer(this.dataLayer.casePrev, true);

				// 巡查路線(預定)
				this.dataLayer.route = new google.maps.Data({ map: this.map });
				this.dataLayer.route.setStyle({ 
					strokeColor: '#FFF',
					strokeWeight: 1,
					strokeOpacity: 1,
					fillColor: '#FF8C00',
					fillOpacity: 0.6,
					zIndex: 1
				});
				
				this.infoWindow = new google.maps.InfoWindow({ pixelOffset: new google.maps.Size(0, -10) });
				this.infoWindow.addListener('domready', () => {
					const caseImg = this.$el.querySelector("#map #case-img");
					if(caseImg) {
						const clickHandle = caseImg.addEventListener("click", () => { 
							this.showImgViewer = true;
							caseImg.removeEventListener("click", clickHandle);
						});
					}
				});

				// 建立marker
				this.pointCurr = new google.maps.Marker({
					// map: this.map,
					icon: {
						url: "/assets/icon/truck.png",
						anchor: new google.maps.Point(12, 12),
						scaledSize: new google.maps.Size(24, 24)
					}
				});

				this.pointCurr.addListener("click", (event) => {
					this.init = false;
					this.setMarkerPosition();
					this.openPanorama();
				})

				// jsts
				this.geometryFactory = new jsts.geom.GeometryFactory();
				resolve();
			})
		},
		setDataLayer(dataLayer, isPrev=false) {
			dataLayer.setStyle(feature => { 
				// console.log(feature.getProperty("caseName"));
				let color = this.options.caseColorMap.filter(color => color.name == '其他')[0].color;
				if(feature.getProperty("DistressType")) {
					const colorFilter = this.options.caseColorMap.filter(color => {
						let caseFlag = false;
						const distressType = this.options.caseTypeMap[feature.getProperty("DistressType")];
						for(const name of color.name) {
							caseFlag = (distressType.indexOf(name) != -1);
							// console.log(name, caseFlag);
							if(caseFlag) break;
						}

						return caseFlag; 
					})
					// console.log(colorFilter);
					
					if(colorFilter.length > 0) color = colorFilter[0].color;
				}

				// console.log(color);

				if(feature.getProperty("isPoint")) {
					return { 
						icon: { 
							url: `/assets/icon/icon_case_${this.options.caseLevelMap[feature.getProperty("DistressLevel")]}.png`,
							anchor: new google.maps.Point(5, 5),
							scaledSize: new google.maps.Size(25, 25),
						}
					};
				} else if(feature.getProperty("isLine")) {
					return { 
						strokeColor: isPrev ? '#556B2F' : color,
						strokeWeight: 3,
						strokeOpacity: isPrev ? 0.4 : 0.8,
						fillOpacity: 0
					};
				} else {
					return { 
						strokeColor: isPrev ? '#556B2F' : color,
						strokeWeight: 1,
						strokeOpacity: 1,
						fillColor: color,
						fillOpacity: isPrev ? 0.3 : 0.7
					};
				}
			});
			dataLayer.addListener('mouseover', (event) => { 
				this.showCaseContent(event.feature, event.latLng);
			});
			dataLayer.addListener('mouseout', (event) => { 
				this.infoWindow.close();
				this.$refs.panoramaView.hightLight(event.feature.getProperty("Id"), false);
			});
		},
		getList() {
			this.loading = true;
			this.init = true;
			this.clearAll();
			this.$router.push({ query: { inspectId: this.listQuery.inspectId, caseInspectId: this.listQuery.caseInspectId }});

			getPanoramaJson({
				inspectId: this.listQuery.inspectId
			}).then(response => {
				if(response.data.inspection.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
					// this.$nextTick(() => this.moveHandle(this.screenWidth));
					this.loading = false;
				} else {
					this.inspectIdNow = this.listQuery.inspectId;
					const jsonUrl = response.data.inspection[0].url;

					// fetch('/test/streetViewFix.json').then(response => response.json()).then(json => {
					fetch(jsonUrl).then(response => response.json()).then(json => {
						// this.panoramaInfo = json;
						// this.panoramaInfo = Object.assign({}, this.panoramaInfo, json);
						this.$set(this.panoramaInfo, "data", json.data);
						this.$set(this.panoramaInfo, "sceneSetting", json.sceneSetting);
						// console.log(this.panoramaInfo);
						this.setPanoramaLayer();
						// this.openPanorama(true);
						// this.loading = false;

						this.getCaseList();
					});
				}
			}).catch(err => this.loading = false);
		},
		getCaseList() {
			for(const layerType of ['casePrev', 'caseNow']) {
				this.dataLayer[layerType].forEach(feature => this.dataLayer[layerType].remove(feature));
			}
			getInspectionCaseGeoJson({
				inspectId: this.listQuery.inspectId,
				caseInspectId: this.listQuery.caseInspectId || 0
			}).then(response => {
				// this.caseGeoJson = response.data.caseGeoJson;
				this.caseGeoJson = Object.assign({}, this.caseGeoJson, response.data.caseGeoJson);
				this.dataLayer.caseNow.addGeoJson(this.caseGeoJson.caseNow);
				this.dataLayer.casePrev.addGeoJson(this.caseGeoJson.casePrev);

				this.$nextTick(() => {
					if(localStorage.inspectIdNow == this.inspectIdNow && localStorage.sceneIdNow) {
						this.$confirm(`是否跳至前次操作街景位址?`).then(() => {
							this.init = false;
							this.showPanoramaLayer(localStorage.sceneIdNow) ;
						})
					} else {
						localStorage.inspectIdNow = this.inspectIdNow;
						localStorage.removeItem("sceneIdNow");
					}
					this.$refs.panoramaView.resetCaseHotSpot();	
					// this.openPanorama(true);
					this.loading = false;
				});
			}).catch(err => this.loading = false);
		},
		getRouteList() {
			this.loading = true;
			this.dataLayer.route.forEach(feature => this.dataLayer.route.remove(feature));

			getInspectionRoute({
				zipCode: this.listQuery.inspectRoundZipCode,
				inspectRound: this.listQuery.inspectRound,
			}).then(response => {
				if (response.data.blockList.length == 0 && response.data.routeList.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.blockList = response.data.blockList;

					let geoJSON = {
						"type": "FeatureCollection",
						"name": "blockJSON",
						"features": []
					};

					for (const blockSpec of this.blockList) {
						let feature = {
							"type": "Feature",
							"properties": {
								"id": blockSpec.id,
								"roadName": blockSpec.roadName
							},
							"geometry": JSON.parse(blockSpec.geometry)
						};
						geoJSON.features.push(feature);
					}
					this.dataLayer.route.addGeoJson(geoJSON);
				}
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		clearRouteLayer() {
			this.dataLayer.route.forEach(feature => this.dataLayer.route.remove(feature));
			this.showLayerAttach = false;
		},
		uploadCase(caseInfo) {
			let uploadForm = new FormData();
			uploadForm.append('inspectId', this.listQuery.inspectId);
			uploadForm.append('trackingId', Number(caseInfo.trackingId));
			uploadForm.append('dateReport', this.formatTime(caseInfo.dateReport));
			uploadForm.append('distressType', caseInfo.distressType);
			uploadForm.append('distressLevel', caseInfo.distressLevel);
			uploadForm.append('millingLength', Number(caseInfo.millingLength));
			uploadForm.append('millingWidth', Number(caseInfo.millingWidth));
			uploadForm.append('millingArea', Number(caseInfo.millingArea));
			uploadForm.append('place', caseInfo.place);
			uploadForm.append('direction', caseInfo.direction);
			uploadForm.append('lane', Number(caseInfo.lane));
			uploadForm.append('geoJson', JSON.stringify(caseInfo.geoJson));
			uploadForm.append('imgZoomIn', data2blob(caseInfo.imgZoomIn, 'image/jpeg'), 'imgZoomIn.jpg');
			uploadForm.append('imgZoomOut', data2blob(caseInfo.imgZoomOut, 'image/jpeg'), 'imgZoomOut.jpg');
			// console.log(uploadForm);

			uploadInspectionCase(uploadForm).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "新增成功",
						type: "success",
					});
				} 
				this.getCaseList();
				this.loading = false;
				this.isUpload = false;
			}).catch(err => {
				console.log(err);
				this.loading = false;
				this.isUpload = false;
			})
		},
		openPanorama(force = false, isReset = false) {
			let ratio = this.clientStartX / this.leftPanel.offsetWidth;
			this.clientStartX = this.leftPanel.offsetWidth;
			if(force || !isReset) {
				ratio = (force || this.clientStartX >= this.screenWidth * 0.5) ? 0.25 : 1;
			}
			this.$nextTick(() => this.moveHandle(this.screenWidth*ratio));
		},
		setHeading(azimuth) {
			// console.log("setHeading: ", azimuth);
			if(this.init) azimuth = 0;
			else azimuth = Math.abs(azimuth) > 360 ? azimuth % 360 : azimuth;
			// console.log("setHeading: ", azimuth);
			// this.$refs.compass.style.transform = `rotate(${-azimuth}deg)`;
			this.map.setHeading(azimuth);
		},
		async setPanoramaLayer() {
			// console.log("setPanoramaLayer");
			this.$refs.panoramaView.setStreetViewList();
			await this.createPolyLine();
			this.pointCurr.setMap(this.map);
		},
		async createPolyLine() {
			const lineInfo = this.panoramaInfo.data;
			if (!lineInfo) return;

			this.$refs.panoramaView.setPanoramaScene();

			// 掛載 polyline Layer(street view)
			lineInfo.forEach((polyInfo, index) => {
				const path = polyInfo.map((info) => info.position);
				this.polyLine.push(
					new google.maps.Polyline({
						path,
						geodesic: true,
						strokeColor: '#409EFF',
						strokeOpacity: 1,
						strokeWeight: 3,
						map: this.map,
						zIndex: 10
					})
				);

				this.polyLine[index].addListener("click", (event) => {
					this.init = false;
					const pointPos = event.latLng.toJSON();
					const posList = this.panoramaInfo.data[index].map(info => ({ ...info.position, sceneId: info.fileName }));
					const minDistObj = posList.reduce((minDistObj, curr) => {
							const distance = Math.sqrt(Math.pow(pointPos.lat - curr.lat, 2) + Math.pow(pointPos.lng - curr.lng, 2));
							if (minDistObj.dist > distance) {
								minDistObj.dist = distance;
								minDistObj.sceneId = curr.sceneId;
							}
							return minDistObj;
						},
						{ dist: Infinity, sceneId: "" }
					);
					this.showPanoramaLayer(minDistObj.sceneId);
				})

				const bounds = new google.maps.LatLngBounds();
				path.forEach(position => {
					if(position.lat >= 22 && position.lat <= 26 && position.lng >= 120 && position.lng <= 122) bounds.extend(position);
				});
				this.map.fitBounds(bounds);
				console.log(bounds.getCenter().toString())
			})
			this.showPanoramaLayer(this.panoramaInfo.data[0][0].fileName);
		},
		showPanoramaLayer(sceneId) {
			// console.log("showPanoramaLayer");
			console.log(sceneId);
			this.sceneId = sceneId;
			this.setMarkerPosition();

			this.$refs.panoramaView.panorama.loadScene(sceneId);
			if(!this.init) {
				localStorage.sceneIdNow = sceneId;
				this.openPanorama(true);
			}
		},
		addMarker({ id, position, type }) {
			// console.log(type, position);

			let icon;
			if(type == 2) {
				icon = { 
					url: `/assets/icon/icon_greenDot.png`,
					scaledSize: new google.maps.Size(6, 6) 
				};
			} else if (type == 3) {
				icon = { 
					url: `/assets/icon/icon_blueDot.png`,
					scaledSize: new google.maps.Size(4, 4) 
				};
			}
			this.markersTemp[id] = new google.maps.Marker({ position, icon, map: this.map });
			this.map.setCenter(position);
		},
		clearMarker(id) {
			if(id != undefined) {
				this.markersTemp[id].setMap(null);
				this.$delete(this.markersTemp, id);
			} else {
				for(const marker of Object.values(this.markersTemp)) marker.setMap(null);
				this.markersTemp = [];
			}
		},
		setMarkerPosition(sceneId) {
			// console.log("setMarkerPosition: ", sceneId);
			this.sceneId = sceneId ? sceneId : this.sceneId;
			const pointInfo = this.panoramaInfo.data.flat().filter(pt => pt.fileName == this.sceneId)[0];
			this.pointCurr.setPosition(pointInfo.position);
			
			if(!this.init) {
				this.map.setCenter(pointInfo.position);
				this.map.setZoom(20);
			}
		},
		showCaseContent(feature, position) {
			const caseTypeStr = `${feature.getProperty("Id")} - ${this.options.caseTypeMap[feature.getProperty("DistressType")]} (${this.options.caseLevelMap[feature.getProperty("DistressLevel")]})`;
			this.setCaseImgViewer({ imgUrls: [ `${feature.getProperty("ImgZoomOut")}` ] });
			let contentText = `<div style="width: 200px;">`;
			contentText += `<div> ${caseTypeStr} </div>`;
			contentText += `<img src="${feature.getProperty("ImgZoomOut")}" class="case-img" id ="case-img" onerror="this.className='case-img hide-img'">`;
			contentText += `</div>`;

			this.infoWindow.setContent(contentText);
			this.infoWindow.setOptions({ pixelOffset: new google.maps.Size(0, -10)});
			this.infoWindow.setPosition(position);

			this.infoWindow.open(this.map);
			this.$refs.panoramaView.hightLight(feature.getProperty("Id"), true);
		},
		setCaseImgViewer({ imgUrls, isOpen=false }) {
			if(imgUrls != null) this.imgUrls = imgUrls;
			this.showImgViewer = isOpen;
		},
		hightLight(blockId) {
			// console.log("highlight", blockId);
			this.infoWindow.close();
			for(const dataLayer of Object.values(this.dataLayer)) {
				dataLayer.revertStyle();

				dataLayer.forEach(feature => {
					this.$refs.panoramaView.hightLight(feature.getProperty("Id"), false);

					if(feature.getProperty("Id") == blockId) {
						this.map.data.overrideStyle(feature, { fillColor: "#FFF176" });
						this.showCaseContent(feature, feature.getProperty("CenterPt"));
						this.$refs.panoramaView.hightLight(feature.getProperty("Id"), true);
					}
				});
			}
		},
		async search() {
			this.loading = true;
			await this.focusMap();
			this.loading = false;
		},
		async focusMap() {
			// console.log("focusMap");
			return new Promise(resolve => {
				this.dataLayer.caseNow.revertStyle();
				this.infoWindow.close();

				if(!this.listQuery.caseId || this.listQuery.caseId.length == 0) resolve();
				if(this.listQuery.caseId.length != 0 && !Number(this.listQuery.caseId)) {
					this.$message({
						message: "請輸入正確缺失Id",
						type: "error",
					});
					resolve();
				} else {
					const caseSpec = this.caseGeoJson.caseNow.features.filter(feature => (feature.properties.Id == this.listQuery.caseId))[0];
					if(caseSpec == undefined ) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
						resolve();
					} else {
						console.log(caseSpec);
						const depth = caseSpec.geometry.type == 'MultiLineString' ? 1 : 2;
						const paths = caseSpec.geometry.coordinates.flat(depth).map(point => ({ lat: point[1], lng: point[0] }));
						const bounds = new google.maps.LatLngBounds();
						paths.forEach(position => bounds.extend(position));
						this.map.fitBounds(bounds);

						this.dataLayer.caseNow.forEach(feature => { 
							if(feature.getProperty("Id") == this.listQuery.caseId) {
								this.showCaseContent(feature, feature.getProperty("CenterPt"));
								resolve();
							}
						});
					}
				}
			})
		},
		intersectRoute() {
			this.dataLayer.route.revertStyle();
			const jstsRoutePoints = this.panoramaInfo.data.flat(1).map(point => this.createJstsGeometry([[ point.position.lng, point.position.lat ]]));
			// console.log(jstsRoutePoints.length);
			this.dataLayer.route.forEach(feature => {
				feature.toGeoJson(json => {
					const jstsBlockPolygon = this.createJstsGeometry(json.geometry.coordinates.flat(2));
					for(let i=0; i <= jstsRoutePoints.length - 1; i++) {
						// console.log(i);
						if(i == 0) this.loading = true;
						if(jstsBlockPolygon.contains(jstsRoutePoints[i])) {
							// console.log("BINGO: ", i);
							this.dataLayer.route.overrideStyle(feature, { fillColor: "#8FBC8F" });
							this.loading = false;
							break;
						} else if(i == jstsRoutePoints.length - 1) {
							this.loading = false;
							this.dataLayer.route.overrideStyle(feature, { fillColor: "#DC143C" });
						}
					}
				});
			})
		},
		createJstsGeometry(boundary) {
			// console.log(boundary);
			let coordinates = boundary.map(coord => new jsts.geom.Coordinate(coord[1], coord[0]));

			if (coordinates.length == 1) return this.geometryFactory.createPoint(coordinates[0]);
			else {
				if(coordinates[0].compareTo(coordinates[coordinates.length-1]) != 0) coordinates.push(coordinates[0]);
				const shell = this.geometryFactory.createLinearRing(coordinates);
				return this.geometryFactory.createPolygon(shell);
			}
		},
		clearAll() {
			// console.log("clearAll");
			this.caseGeoJson = Object.assign({}, this.caseGeoJson, { caseNow: {}, casePrev: {} });

			this.pointCurr.setMap(null);

			for(const polyline of this.polyLine) polyline.setMap(null);
			this.polyLine = [];

			this.clearMarker();
			this.dataLayer.route.revertStyle();

			this.panoramaInfo = Object.assign({}, this.panoramaInfo, { data: [], sceneSetting: {}, streetViewList: {} });
			this.$refs.panoramaView.removeAllScene();
		},
		moveHandle(nowClientX) {
			const computedPercent = (nowClientX - this.clientStartX) / this.screenWidth * 100;
			// console.log("computedPercent: ", computedPercent);
			const leftBoxWidth = parseInt(this.leftPanel.style.width);
			// console.log("leftBoxWidth: ", leftBoxWidth);
			let changePercent = (nowClientX == this.screenWidth) ? 100 : Math.ceil((leftBoxWidth + computedPercent) * 100) / 100;
			if (changePercent < 25) changePercent = 25;
			else if (changePercent >= 100) changePercent = 100;
			// console.log("changePercent: ", changePercent);

			this.leftPanel.style.width = `${changePercent}%`;
			this.rightPanel.style.width = `${100 - changePercent}%`;
			this.clientStartX = nowClientX;

			if(nowClientX == this.screenWidth) this.setHeading(0);
			else {
				this.$refs.panoramaView.setHeading();
				this.$refs.panoramaView.panorama.resize();
			}
		},
		formatter(row, column) {
			if(Number(row[column.property])) return row[column.property].toLocaleString();
			else return row[column.property];
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
.case-mark
	position: relative
	height: 100%
	width: 100%
	.header-bar
		position: absolute
		top: 0
		z-index: 10
		padding-left: 10px
		.route-title
			text-stroke: 0.6px white
			-webkit-text-stroke: 0.6px white
		.filter-container 
			& > *
				padding-right: 5px
			.el-select
				width: 120px
			.el-input__inner
				padding-left: 5px
				text-align: center
		.filter-item
			margin-right: 5px
	.touch-div 
		position: absolute
		top: 0
		height: 100%
		right: 100%
		width: 14px
		display: flex
		justify-content: center
		align-items: center
		cursor: col-resize
		z-index: 20
		background-color: rgba(#F2F6FC, 0.4)
		span 
			width: 2px
			background: #aaa
			margin: 0 2px
			height: 15px
	.img-preview
		width: 100%
		.el-image-viewer__mask
			opacity: 0.7
		.el-icon-circle-close
			color:  #FFF
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
			.case-img
				cursor: pointer
				width: 100%
				object-fit: scale-down
				&.hide-img
					display: none
	.btn-map
		display: flex
		flex-direction: column
		justify-content: space-around
		position: absolute
		width: 40px
		// height: 80px
		bottom: 120px
		right: 10px
		.btn-action
			position: relative
			padding: 0 !important
			background-color: #fff
			min-width: 40px !important
			i 
				font-size: 24px
			&.btn-target
				height: 40px
			&.btn-compass
				height: 40px
				border-radius: 50%
				border: 1px solid #fff
				margin-bottom: 5px
				background-color: rgba(#000, 0.1)
				background-image: url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%2250%22%20width%3D%2250%22%3E%0A%3Cpath%20d%3D%22m24.5078%206-3.2578%2018h7.5l-3.25781-18h-0.984376zm-3.2578%2020%203.2578%2018h0.9844l3.2578-18h-7.5zm1.19531%200.9941h5.10938l-2.5547%2014.1075-2.5547-14.1075z%22%2F%3E%0A%3C%2Fsvg%3E%0A')
				background-size: cover
				background-repeat: no-repeat
				background-position: center
				transition: 0.1s
	.right-panel
		height: calc(100vh - 50px)
</style>