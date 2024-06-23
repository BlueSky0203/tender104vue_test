<template>
	<div class="case-inspection-map" v-loading="loading">
		<div id="map" ref="map" />
		<div class="header-bar">
			<h2 class="case-title">案件地圖</h2>
			<div class="filter-container">
				<span v-if="inspectIdList.length == 0" class="filter-container">
					<div class="filter-item">
						<div class="select-contract el-input el-input--medium el-input-group el-input-group--prepend">
							<div class="el-input-group__prepend">
								<span>合約</span>
							</div>
							<el-select v-model.number="listQuery.tenderRound" class="tender-select" popper-class="type-select tender">
								<el-option v-for="(val, type) in options.tenderRoundMap" :key="type" :label="val.name" :value="Number(type)">
									<div :style="`color: #${Math.floor(val.tenderId*16777215).toString(16).substr(0, 8)}`">{{ val.name }}</div>
								</el-option>
							</el-select>
						</div>
					</div>
					<el-button class="filter-item" type="success" @click="getList()">載入</el-button>
				</span>
				<span v-else class="filter-container">
					<el-button-group v-if="inspectIdList.length > 0" class="filter-item">
						<el-button type="success" size="small" :plain="listQuery.inspectId != 0" @click="changeInspect(0)">全部</el-button>
						<el-button v-for="inspectId in inspectIdList" :key="inspectId" type="primary" size="small" :plain="listQuery.inspectId != inspectId" @click="changeInspect(inspectId)">{{ inspectId }}</el-button>
						<el-button type="info" size="small" @click="changeInspect(-1)">隱藏</el-button>
					</el-button-group>
					<el-button class="filter-item" type="primary" size="small" @click="changeTender()">更改</el-button>
					<br>
					<span class="filter-item" style="display: inline-flex; height: 45px; align-items: center">
						<el-button :type="showCoverRatioLayer ? 'primary' : 'info'" size="small" style="height: 32px" @click="showCoverRatio()">覆蓋</el-button>
						<el-card v-if="showCoverRatioLayer" :body-style="{ padding: '5px', backgroundColor: 'rgba(255, 255, 255, 0.5)' }">
							<span v-if="blockInfo.total != 0">{{ blockInfo.ratio }}% </span>
						</el-card>
					</span>
					<span class="filter-item" style="display: inline-flex; height: 45px; align-items: center">
						<el-button :type="showSearchRoadLayer ? 'primary' : 'info'" size="small" style="height: 32px" @click="showSearchRoad()">搜尋</el-button>
						<el-card v-if="showSearchRoadLayer" :body-style="{ padding: '0px', backgroundColor: 'rgba(255, 255, 255, 0.5)' }">
							<div class="filter-item">
								<el-input v-model="listQuery.filterId" size="small" placeholder="請輸入">
									<span slot="prepend">道路名稱</span>
								</el-input>
							</div>
							<el-button class="filter-item" type="primary" size="small" icon="el-icon-search" @click="search()" />
						</el-card>
					</span>
				</span>
			</div>
		</div>

		<transition name="el-zoom-in-top">
			<el-card v-if="caseList.length > 0" class="info-box left">
				<span v-if="!showChart">
					<div style="width: 100%; text-align: center; line-height: 30px">案件列表({{ filterIdNow.length != 0 ? filterIdNow : inspectIdNow == 0 ? '全部' : inspectIdNow }})</div>
					<el-button-group style="width: 100%; margin-bottom: 5px;">
						<el-button style="width: 50%" @click="handleDownload()">下載CSV</el-button>
						<el-button :type="showChart ? 'primary' : 'info'" style="width: 50%" @click="showChart = !showChart">圖表</el-button>
					</el-button-group>

					<el-table 
						empty-text="目前沒有資料" 
						:data="caseList"
						size="mini"
						fit 
						:header-cell-style="{'background-color': '#F2F6FC'}"
						max-height="465px"
						style="width: 100%;"
						@cell-mouse-enter="handleMouseEnterList"
						@cell-mouse-leave="handleMouseLeaveList"
					>
						<el-table-column 
							v-for="(value, key) in headerList" 
							:key="key" 
							:prop="key" 
							:label="value"
							:formatter="(row, column, cellValue) => (cellValue != undefined ? cellValue : '-')"
							:width="['caseId', 'caseLevel'].includes(key) ? 70 : null"
							align="center"
							:filters="getFilter(key)"
							:filter-method="handleFilter"
						/>
					</el-table>
				</span>

				<span v-else>
					<div style="width: 100%; text-align: center; line-height: 30px">缺失類型({{ filterIdNow.length != 0 ? filterIdNow : inspectIdNow == 0 ? '全部' : inspectIdNow }})</div>
					<el-button-group style="width: 100%; margin-bottom: 5px;">
						<el-button type="primary" style="width: 100%" @click="showChart = !showChart">圖表</el-button>
					</el-button-group>
					<el-table 
						empty-text="目前沒有資料" 
						:data="caseInfo"
						size="mini"
						fit 
						:header-cell-style="{'background-color': '#F2F6FC'}"
						max-height="555px"
						style="width: 100%;"
						:row-class-name="tableRowClassName"
						@cell-mouse-enter="handleMouseEnterInfo"
						@cell-mouse-leave="handleMouseLeaveInfo"
					>
						<el-table-column 
							v-for="(value, key) in headerInfo" 
							:key="key" 
							:prop="key" 
							:label="value"
							:formatter="(row, column, cellValue) => (cellValue != undefined ? cellValue : '-')"
							:width="['total', 'ratio'].includes(key) ? 70 : null"
							align="center"
						/>
					</el-table>
				</span>
			</el-card>
		</transition>

		<transition name="el-zoom-in-top">
			<el-card v-if="showChart" class="info-box chart-1">
				<div style="text-align: center">圓餅圖({{ filterIdNow.length != 0 ? filterIdNow : inspectIdNow == 0 ? '全部' : inspectIdNow }})</div>
				<pie-chart ref="pieChart" title="" :showLegend="false" :pie-data="{ chartType: 'pie', data: caseInfo.map(caseSpec => ({ value: caseSpec.total, name: caseSpec.caseName })) }" />
			</el-card>
		</transition>

		<transition name="el-zoom-in-top">
			<el-card v-if="showChart" class="info-box chart-2">
				<div style="text-align: center">堆疊長條圖({{ filterIdNow.length != 0 ? filterIdNow : inspectIdNow == 0 ? '全部' : inspectIdNow }})</div>
				<div ref="barChart" style="width: 100%; height: 400px;" />
			</el-card>
		</transition>
		
		<transition name="el-zoom-in-center">
			<el-card v-if="Object.keys(caseSpecInfo).length > 0" class="info-box bottom">
				<el-button type="text" style="float: right;" @click="caseSpecInfo={}"><i class="el-icon-close" style="font-size: 20px;" /></el-button>
				<el-row :gutter="10" type="flex" align="center" justify="center">
					<el-col :span="8">
						<el-carousel height="200px" :autoplay="false" indicator-position="none">
							<el-carousel-item >
								<el-image :src="caseSpecInfo.ImgZoomOut" fit="cover" @click="showImgViewer = true" />
							</el-carousel-item>
							<el-carousel-item >
								<el-image :src="caseSpecInfo.ImgZoomIn" fit="cover" @click="showImgViewer = true" />
							</el-carousel-item>
						</el-carousel>
					</el-col>
					<el-col :span="16" class="case-info">
						<el-row :gutter="3">
							<el-col :span="4" class="case-title">日期: </el-col>
							<el-col :span="10">{{ formatTime(caseSpecInfo.DateReport) }}</el-col>
							<el-col :span="4" class="case-title">ID: </el-col>
							<el-col :span="6">{{ caseSpecInfo.Id }}</el-col>
						</el-row>
						<el-row :gutter="3">
							<el-col :span="4" class="case-title">類型: </el-col>
							<el-col :span="10">{{ options.caseTypeMapFlat[caseSpecInfo.DistressType] }}</el-col>
							<el-col :span="4" class="case-title">程度: </el-col>
							<el-col :span="6">{{ options.caseLevelMap[caseSpecInfo.DistressLevel] }}</el-col>
						</el-row>
						<el-row>
							<el-col :span="4" class="case-title">面積: </el-col>
							<el-col :span="20">{{ caseSpecInfo.MillingLength }} x {{ caseSpecInfo.MillingWidth }} = {{ caseSpecInfo.MillingArea }}</el-col>
						</el-row>
						<el-row>
							<el-col :span="4" class="case-title">地址: </el-col>
							<el-col :span="20">{{ caseSpecInfo.Place }}</el-col>
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

		<panorama-view ref="panoramaView" :isEdit="false" :loading.sync="loading" :panoramaInfo.sync="panoramaInfo" :options="options" :caseGeoJson="{ caseNow: caseGeoJson[0] }" @showPanoramaLayer="showPanoramaLayer" />
	</div>
</template>

<script>
import moment from "moment";
import * as jsts from 'jsts/dist/jsts.min.js';
import { Loader } from "@googlemaps/js-api-loader";
import { stringify } from 'csv-stringify/dist/esm/sync';
import echarts from "echarts/lib/echarts";
require("echarts/theme/macarons");
require("echarts/lib/chart/bar");
import { getPanoramaJson, getInspectionCaseGeoJson, getInspectionRoute } from "@/api/inspection";
import { getTenderRound, getDistMap, getDTypeMap, getCompetentTypeMap } from "@/api/type";
import PanoramaView from '@/components/PanoramaView';
import PieChart from "@/components/Charts/PieChart";
import ElImageViewer from 'element-ui/packages/image/src/image-viewer';
import 'element-ui/lib/theme-chalk/base.css';

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
	name: "caseInspectionMap",
	components: { PanoramaView, ElImageViewer, PieChart },
	data() {
		return {
			loading: false,
			showCoverRatioLayer: false,
			showSearchRoadLayer: false,
			showChart: false,
			showImgViewer: false,
			// map: null,
			// dataLayer: {},
			// polyLine: {},
			infoWindow: null,
			caseInfo: {},
			caseSpecInfo: {},
			caseList: [],
			inspectIdList: [],
			blockList: [],
			caseGeoJson: {},
			inspectIdNow: 0,
			rowIndexNow: -1,
			filterIdNow: "",
			listQuery: {
				tenderRound: 91,
				inspectId: 0,
				filterId: ""
			},
			blockInfo: {
				total: 0,
				intersect: 0,
				ratio: 0
			},
			// panoramaInfo: {
			// 	data: [],
			// 	sceneSetting: {}, 
			// 	streetViewList: {}
			// },
			headerList: {
				caseId: "Id",
				caseName: "類型",
				caseLevel: "程度"
			},
			headerInfo: {
				caseName: "類型",
				total: "數量",
				ratio: "佔比"
			},
			options: { 
				tenderRoundMap: {},
				districtMap: {},
				competentTypeMap: {},
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
				caseTypeMap: {},
				caseTypeMapFlat: {},
				caseLevelMap: {
					1: "輕",
					2: "中",
					3: "重"
				},
				caseLevelMapE: {
					1: "L",
					2: "M",
					3: "H"
				},
				roadDir: {
					// 0: "無",
					1: "順向",
					2: "逆向"
				}
			}
		};
	},
	computed: { },
	watch: { 
		showCoverRatioLayer() {
			if(!this.showSearchRoadLayer && !this.showCoverRatioLayer) this.clearRouteLayer();
		},
		showSearchRoadLayer() {
			if(!this.showCoverRatioLayer && !this.showSearchRoadLayer) this.clearRouteLayer();
		},
		showChart() {
			if(!this.showChart) return;

			this.$nextTick(() => {
				this.setBarChart(true);

				if(this.showChart) {
					this.$nextTick(() => {
						this.$refs.pieChart.chart.on('mouseover', (params) => {
							const rowIndex = this.caseInfo.filter(caseSpec => caseSpec.caseName == params.name)[0].index;
							this.rowIndexNow = rowIndex;
						})
						this.$refs.pieChart.chart.on('mouseout', (params) => {
							this.rowIndexNow = -1;
						})
					})
				}
			})
		}
	},
	created() {
		this.dataLayer = { caseNow: {}, route: {} };
		this.polyLine = {};
		this.panoramaInfo = { data: [], sceneSetting: [], streetViewList: {} };

		getTenderRound({
			excludeShadow: true
		}).then(response => {
			this.options.tenderRoundMap = response.data.list.reduce((acc, cur) => {
				if(cur.tenderId <= 1001) return acc;

				let roundId = `${cur.tenderId}${String(cur.round).padStart(3, '0')}`;
				if(cur.zipCodeSpec != 0) roundId += `${cur.zipCodeSpec}`;

				let name = `${cur.tenderName}`;
				if(cur.title.length != 0) name += `_${cur.title}`;

				acc[roundId] = { 
					id: cur.id,
					name, 
					tenderId: cur.tenderId, 
					isMain: cur.zipCodeSpec == 0,
					zipCode: cur.zipCodeSpec == 0 ? cur.zipCode : cur.zipCodeSpec, 
					roundStart: cur.roundStart, 
					roundEnd: cur.roundEnd
				};
				return acc;
			}, {});

			if(Object.keys(this.options.tenderRoundMap).length > 0) {
				if(!Object.keys(this.options.tenderRoundMap).includes(String(this.listQuery.tenderRound))) {
					this.listQuery.tenderRound = this.$route.query.surveyId = Number(Object.keys(this.options.tenderRoundMap)[0]);
				}
			}
			if(Object.keys(this.options.tenderRoundMap).length == 0) {
				this.options.tenderRoundMap = { "-1": { id: -1 }};
				this.listQuery.tenderRound = -1;
			}
		});

		getDTypeMap().then(response => {
			this.options.caseTypeMap = response.data.distressTypeMap;
			this.options.caseTypeMapFlat = Object.values(response.data.distressTypeMap).reduce((acc, cur) => {
				for (const key in cur) acc[key] = cur[key];
				return acc;
			}, {});
		})

		getCompetentTypeMap().then(response => {
			this.options.competentTypeMap = response.data.competentTypeMap;
		})
	},
	async mounted() {
		// this.loading = true;
		this.$refs.panoramaView.showPanorama = false;
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
			await this.initMap();
			await getDistMap().then(response => {
				Object.keys(response.data.districtMap).filter(key => key != 1000 && key <= 1001).forEach(key => {
					this.$set(this.options.districtMap, key, response.data.districtMap[key]);
				})
			});
		}).catch(err => console.log("err: ", err));
	},
	methods: {
		// init google map
		async initMap() {
			return new Promise(resolve => {
				const location = {
					lat: 25.0685406,
					lng: 121.5280918
				}

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

				// 載入區域GeoJson
				this.dataLayer.mask = new google.maps.Data({ map: this.map });
				// this.dataLayer.mask.loadGeoJson(`/assets/json/NewTaipei.geojson?t=${Date.now()}`);
				this.dataLayer.mask.loadGeoJson(`/assets/json/Taiwan.geojson?t=${Date.now()}`);
				this.dataLayer.mask.setStyle({
					strokeColor: "#000000",
					strokeWeight: 0,
					strokeOpacity: 1,
					fillColor: "#000000",
					fillOpacity: 0.7,
					zIndex: 0
				});

				this.dataLayer.district = new google.maps.Data({ map: this.map });
				this.dataLayer.district.loadGeoJson(`/assets/json/district.geojson?t=${Date.now()}`);
				// console.log(JSON.stringify(this.distGeoJSON));
				// console.log(distGeoJSON);

				// 缺失
				this.dataLayer.caseNow = new google.maps.Data({ map: this.map });
				this.setDataLayer(this.dataLayer.caseNow);

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
				// this.infoWindow.addListener('domready', () => {
				// 	const caseImg = this.$el.querySelector("#map #case-img");
				// 	if(caseImg) {
				// 		const clickHandle = caseImg.addEventListener("click", () => { 
				// 			this.showImgViewer = true;
				// 			caseImg.removeEventListener("click", clickHandle);
				// 		});
				// 	}
				// });

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
						const distressType = this.options.caseTypeMapFlat[feature.getProperty("DistressType")];
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
							url: `/assets/icon/icon_case_${this.options.caseLevelMapE[feature.getProperty("DistressLevel")]}.png`,
							scaledSize: new google.maps.Size(25, 25),
						}
					};
				} else if(feature.getProperty("isLine")) {
					return { 
						strokeColor: isPrev ? '#556B2F' : color,
						strokeWeight: 6,
						strokeOpacity: isPrev ? 0.4 : 0.8,
						fillOpacity: 0,
						zIndex: 10
					};
				} else {
					return { 
						strokeColor: isPrev ? '#556B2F' : color,
						strokeWeight: 1,
						strokeOpacity: 0.5,
						fillColor: color,
						fillOpacity: isPrev ? 0.3 : 0.7,
						zIndex: 10
					};
				}
			});
			dataLayer.addListener('mouseover', (event) => { 
				this.showCaseContent(event.feature, event.latLng);
			});
			dataLayer.addListener('mouseout', (event) => { 
				this.infoWindow.close();
			});
			dataLayer.addListener('click', (event) => { 
				this.showCaseDetail(event.feature);
			});
		},
		tableRowClassName({ row, rowIndex }) {
			row.index = rowIndex;
			if(rowIndex == this.rowIndexNow) return 'highlight-row';
			return '';
		},
		getList() {
			this.loading = true;
			this.clearAll();
			const tenderRound = this.options.tenderRoundMap[this.listQuery.tenderRound];

			getPanoramaJson({
				surveyId: tenderRound.id
			}).then(async response => {
				if(response.data.inspection.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
					this.loading = false;
				} else {
					this.dataLayer.district.forEach(feature => {
						// console.log(feature);
						const condition = [1001, 999].includes(tenderRound.zipCode) || this.options.districtMap[tenderRound.zipCode].district.includes(feature.getProperty("TOWNNAME"));
						this.dataLayer.district.overrideStyle(feature, {
							strokeColor: "#827717",
							strokeWeight: 3,
							strokeOpacity: 0.2,
							fillColor: "#000000",
							fillOpacity: condition ? 0 : 0.7,
							zIndex: 0
						})
					});

					this.inspectIdList = response.data.inspection.map(l => l.InspectId);
					let path = [];
					for(const inspecData of response.data.inspection) {
						await fetch(inspecData.url).then(response => response.json()).then(async (json) => {
							this.panoramaInfo.sceneSetting.push({ inspectId: inspecData.InspectId, ...json.sceneSetting });
							this.panoramaInfo.data.push(json.data);

							const posData = json.data.flat().map(info => info.position);
							path.push(...posData);
							await this.createPolyLine(inspecData.InspectId, json.data);
						});
					}
					this.getCaseList();

					const bounds = new google.maps.LatLngBounds();
					path.forEach(position => {
						if(position.lat >= 22 && position.lat <= 26 && position.lng >= 120 && position.lng <= 122) bounds.extend(position);
					});
					this.map.fitBounds(bounds);
					// this.loading = false;
				}
			}).catch(err => this.loading = false);
		},
		getCaseList() {
			const tenderRound = this.options.tenderRoundMap[this.listQuery.tenderRound];
			getInspectionCaseGeoJson({
				surveyId: tenderRound.id
			}).then(response => {
				this.caseGeoJson[0] = response.data.caseGeoJson.caseNow;
				this.caseGeoJson[0].features.sort((a, b) => (a.properties.DistressType - b.properties.DistressType));
				this.createCaseInfo();
				this.createCaseList();

				for(const inspectId of this.inspectIdList) {
					const featureFilter = response.data.caseGeoJson.caseNow.features.filter(feature => feature.properties.InspectId == inspectId);
					this.caseGeoJson[inspectId] = {
						"type": "FeatureCollection",
						"name": "caseGeoJSON",
						"features": featureFilter
					};
				}
				this.dataLayer.caseNow.addGeoJson(this.caseGeoJson[0]);
				this.$refs.panoramaView.setStreetViewList();
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		createCaseInfo(featureList = this.caseGeoJson[this.listQuery.inspectId].features) {
			let caseTotal = 0;
			this.caseInfo = featureList.reduce((acc, cur) => {
				if(acc.length == 0 || acc[acc.length-1].DistressType != cur.properties.DistressType) {
					const caseName = this.options.caseTypeMapFlat[cur.properties.DistressType];

					acc.push({ 
						DistressType: cur.properties.DistressType, 
						caseName, 
						1: cur.properties.DistressLevel == 1 ? 1 : 0,
						2: cur.properties.DistressLevel == 2 ? 1 : 0,
						3: cur.properties.DistressLevel == 3 ? 1 : 0,
						total: 1 
					});
				} else {
					acc[acc.length-1].total++;
					if(cur.properties.DistressLevel == 1) acc[acc.length-1]['1']++;
					if(cur.properties.DistressLevel == 2) acc[acc.length-1]['2']++;
					if(cur.properties.DistressLevel == 3) acc[acc.length-1]['3']++;
				}
				caseTotal++;

				return acc
			}, []);
			this.caseInfo.forEach(caseSpec => caseSpec.ratio = `${Math.round(caseSpec.total/caseTotal *10000) / 100}%`);

			this.caseInfo.sort((a, b) => (b.total - a.total));
			if(this.showChart) {
				this.showChart = false;
				this.$nextTick(() => this.showChart = true);
			}
		},
		createCaseList(featureList = this.caseGeoJson[this.listQuery.inspectId].features) {
			this.caseList = featureList.map(feature => ({
				caseId: feature.properties.Id,
				caseName: this.options.caseTypeMapFlat[feature.properties.DistressType],
				caseLevel: this.options.caseLevelMap[feature.properties.DistressLevel],
				place: feature.properties.Place,
				millingLength: Math.round(feature.properties.MillingLength * 100) / 100,
				millingWidth: Math.round(feature.properties.MillingWidth * 100) / 100,
				millingArea: Math.round(feature.properties.MillingArea * 100) / 100,
				imgZoomIn: feature.properties.ImgZoomIn,
				imgZoomOut: feature.properties.ImgZoomOut
			}));

			this.caseInfo.sort((a, b) => (b.total - a.total));
		},
		getFilter(property) {
			if(property == 'caseName') return this.caseInfo.map(caseSpec => ({ text: caseSpec.caseName, value: caseSpec.caseName }));
			else if(property == 'caseLevel') return Object.keys(this.options.caseLevelMap).map(key => ({ text: this.options.caseLevelMap[key], value: this.options.caseLevelMap[key] }));
			else return null;
		},
		handleFilter(value, row, column) {
			return row[column.property] === value;
		},
		handleMouseEnterList(row, column, cell, event) {
			let featureList = [];
			this.dataLayer.caseNow.forEach(feature =>{ 
				if(feature.getProperty("Id") == row.caseId) featureList.push(feature);
			});
			const bounds = new google.maps.LatLngBounds();
			for(const feature of featureList) {
				this.dataLayer.caseNow.overrideStyle(feature, { strokeColor: "#8FBC8F", strokeWeight: 4 });
				const paths = feature.getGeometry();
				this.showCaseContent(feature, feature.getProperty("CenterPt"));
				// console.log(paths);
				paths.forEachLatLng(position => bounds.extend(position));
			}
			this.map.fitBounds(bounds);
		},
		handleMouseLeaveList(row, column, cell, event) {
			// console.log(row.blockId);
			this.dataLayer.caseNow.revertStyle();
		},
		handleMouseEnterInfo(row, column, cell, event) {
			this.$refs.pieChart.chart.dispatchAction({
				type: 'highlight',
				name: row.caseName
			});
			this.$refs.pieChart.chart.dispatchAction({
				type: 'showTip',
				name: row.caseName,
				position: ['50%', '50%']
			});

			this.barChart.dispatchAction({
				type: 'highlight',
				name: row.caseName
			});
			this.barChart.dispatchAction({
				type: 'showTip',
				name: row.caseName
			});
		},
		handleMouseLeaveInfo(row, column, cell, event) {
			this.$refs.pieChart.chart.dispatchAction({
				type: 'downplay',
			});
			this.$refs.pieChart.chart.dispatchAction({
				type: 'hideTip'
			});

			this.barChart.dispatchAction({
				type: 'downplay',
			});
			this.barChart.dispatchAction({
				type: 'hideTip'
			});
		},
		async getRouteList() {
			return new Promise (resolve => {
				this.loading = true;
				this.dataLayer.route.forEach(feature => this.dataLayer.route.remove(feature));
				const tenderRound = this.options.tenderRoundMap[this.listQuery.tenderRound];

				getInspectionRoute({
					zipCode: tenderRound.zipCode,
					inspectRound: 0,
				}).then(response => {
					if (response.data.blockList.length == 0) {
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

						resolve();
					}
					this.loading = false;
				}).catch(err => this.loading = false);
			})
		},
		clearRouteLayer() {
			this.blockInfo = { total: 0, intersect: 0, ratio: 0 };
			this.listQuery.filterId = "";
			this.filterIdNow = "";

			this.dataLayer.route.forEach(feature => this.dataLayer.route.remove(feature));
		},
		showPanoramaLayer(sceneId) {
			// console.log("showPanoramaLayer");
			// console.log(sceneId);
			// console.log(this.panoramaInfo);
			// this.sceneId = sceneId;
			this.$refs.panoramaView.panorama.loadScene(sceneId);
			this.$refs.panoramaView.showPanorama = true;
		},
		showCoverRatio() {
			this.showCoverRatioLayer = !this.showCoverRatioLayer;

			if(this.showCoverRatioLayer) {
				if(this.showSearchRoadLayer) {
					this.showSearchRoadLayer = false;
					this.intersectRoute();
				} else this.getRouteList().then(() => this.intersectRoute());
			} else this.clearRouteLayer();
		},
		showSearchRoad() {
			this.showSearchRoadLayer = !this.showSearchRoadLayer;

			if(this.showSearchRoadLayer) {
				if(this.showCoverRatioLayer) this.showCoverRatioLayer = false;
				else this.getRouteList();
			} else this.clearRouteLayer();
		},
		changeTender() {
			this.inspectIdList = []; 
			this.showChart = false;
			this.showCoverRatioLayer = false;
			this.showSearchRoadLayer = false;
			this.dataLayer.district.revertStyle();
			this.clearAll();
		},
		changeInspect(inspectId) {
			for(const key in this.polyLine) for(const polyline of this.polyLine[key]) polyline.setMap(inspectId == 0 ? this.map : null);
			this.listQuery.inspectId = inspectId;
			this.showCoverRatioLayer = false;
			this.showSearchRoadLayer = false;

			if(inspectId == -1) return;
			else this.inspectIdNow = inspectId;

			this.loading = true;
			this.createCaseInfo();
			this.createCaseList();
			if(inspectId != 0) for(const polyLine of this.polyLine[inspectId]) polyLine.setMap(this.map);

			this.dataLayer.caseNow.forEach(feature => this.dataLayer.caseNow.remove(feature));
			this.dataLayer.caseNow.addGeoJson(this.caseGeoJson[inspectId]);
			this.loading = false;
		},
		async search() {
			this.loading = true;
			await this.focusMap();
			this.loading = false;
		},
		async focusMap() {
			return new Promise(resolve => {
				// console.log("focusMap");
				this.dataLayer.route.revertStyle();
				this.filterIdNow = "";

				if(!this.listQuery.filterId || this.listQuery.filterId.length == 0) resolve();
				else {
					let featureList = [];
					this.dataLayer.route.forEach(feature =>{ 
						if(feature.getProperty("roadName") == this.listQuery.filterId) featureList.push(feature);
					});

					if(featureList.length == 0) {
					// if(blockSpec == undefined ) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
						resolve();
					} else {
						this.filterIdNow = this.listQuery.filterId;
						this.intersectCase();

						const bounds = new google.maps.LatLngBounds();
						for(const feature of featureList) {
							this.dataLayer.route.overrideStyle(feature, { fillColor: "#87CEEB", strokeWeight: 1,  zIndex: 3 });
							const paths = feature.getGeometry();
							// console.log(paths);
							paths.forEachLatLng(position => bounds.extend(position));
						}
						this.map.fitBounds(bounds);
						resolve();	
					}
				}
			})
		},
		async createPolyLine(inspectId, lineInfo) {

			// 掛載 polyline Layer(street view)
			lineInfo.forEach((polyInfo, index) => {
				const path = polyInfo.map((info) => info.position);
				if(this.polyLine[inspectId] == undefined) this.polyLine[inspectId] = [];
				this.polyLine[inspectId].push(
					new google.maps.Polyline({
						path,
						geodesic: true,
						strokeColor: '#409EFF',
						strokeOpacity: 0.5,
						strokeWeight: 6,
						map: this.map,
						zIndex: 10
					})
				);

				this.polyLine[inspectId][index].addListener("click", (event) => {
					// console.log("click");
					const pointPos = event.latLng.toJSON();
					const posList = this.panoramaInfo.data.flat(2).map(info => ({ ...info.position, sceneId: info.fileName }));
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
			})
		},
		setBarChart(init=false) {
			if(init) {
				this.barChart = echarts.init(this.$refs.barChart, "macarons", {
					width: "auto",
					height: "auto",
				});

				this.barChart.on('mouseover', (params) => {
					const rowIndex = this.caseInfo.filter(caseSpec => caseSpec.caseName == params.name)[0].index;
					this.rowIndexNow = rowIndex;
				})
				this.barChart.on('mouseout', (params) => {
					this.rowIndexNow = -1;
				})
			}

			let series = [];
			for (const level in this.options.caseLevelMap) {
				series.push({
					type: "bar",
					name: this.options.caseLevelMap[level],
					data: this.caseInfo.map(caseSpec => caseSpec[level]),
					stack: "數量",
					barWidth: "30%",
					itemStyle: {
						borderColor: "#aaa",
						borderWidth: 1,
						borderType: "solid",
						opacity: 1,
					},
					offset: [0, 20]
				});
			}

			// console.log(series);

			const options = {
				xAxis: {
					name: "類型",
					type: "category",
					data: this.caseInfo.map(caseSpec => caseSpec.caseName),
					axisTick: {
						show: false,
						// alignWithLabel: true
					},
					axisLabel: {
						rotate: -35
					}
				},
				yAxis: {
					name: "數量",
					type: "value",
					axisTick: {
						show: false,
					},
				},
				tooltip: {
					trigger: "axis",
					axisPointer: {
						type: "shadow",
						shadowStyle: {
							opacity: 0.9,
						},
					},
					padding: [5, 10]
				},
				grid: {
					top: 55,
					bottom: 20,
					left: 30,
					right: 100,
					containLabel: true,
				},
				legend: { show: false },
				series: series,
			};

			this.barChart.setOption(options);
		},
		showCaseContent(feature, position) {
			const caseTypeStr = `${feature.getProperty("Id")} - ${this.options.caseTypeMapFlat[feature.getProperty("DistressType")]} (${this.options.caseLevelMap[feature.getProperty("DistressLevel")]})`;
			this.setCaseImgViewer({ imgUrls: [ `${feature.getProperty("ImgZoomOut")}` ] });
			let contentText = `<div style="width: 200px;">`;
			contentText += `<div> ${caseTypeStr} </div>`;
			// contentText += `<img src="${feature.getProperty("ImgZoomOut")}" class="case-img" id ="case-img" onerror="this.className='case-img hide-img'">`;
			contentText += `</div>`;

			this.infoWindow.setContent(contentText);
			this.infoWindow.setOptions({ pixelOffset: new google.maps.Size(0, feature.getProperty('isPoint') ? -20 : -10)});
			this.infoWindow.setPosition(position);

			this.infoWindow.open(this.map);
		},
		showCaseDetail(feature) {
			this.caseSpecInfo = {};
			this.setCaseImgViewer({ imgUrls: [ feature.getProperty("ImgZoomOut") , feature.getProperty("ImgZoomIn")] });

			this.$nextTick(() => {
				this.caseSpecInfo = {
					Id: feature.getProperty("Id"),
					DateReport: feature.getProperty("DateReport"),
					DistressType: feature.getProperty("DistressType"),
					DistressLevel: feature.getProperty("DistressLevel"),
					Place: feature.getProperty("Place"),
					MillingLength: Math.round(feature.getProperty("MillingLength") * 100) / 100,
					MillingWidth: Math.round(feature.getProperty("MillingWidth") * 100) / 100,
					MillingArea: Math.round(feature.getProperty("MillingArea") * 100) / 100,
					ImgZoomIn: feature.getProperty("ImgZoomIn"),
					ImgZoomOut: feature.getProperty("ImgZoomOut"),
				}
			})
		},
		setCaseImgViewer({ imgUrls, isOpen=false }) {
			if(imgUrls != null) this.imgUrls = imgUrls;
			this.showImgViewer = isOpen;
		},
		intersectRoute() {
			this.blockInfo = { total: 0, intersect: 0, ratio: 0 };

			this.dataLayer.route.revertStyle();
			let polyLineArr = [];
			if(this.listQuery.inspectId == 0) polyLineArr = Object.values(this.polyLine).flat(1);
			else polyLineArr = this.polyLine[this.listQuery.inspectId];

			const jstsRoutePoints = polyLineArr.flat(1).map(polyLine => polyLine.getPath().getArray()).flat(1).map(pos => this.createJstsGeometry([[ pos.lng(), pos.lat() ]]));

			this.dataLayer.route.forEach(feature => {
				this.blockInfo.total++;

				feature.toGeoJson(json => {
					const jstsBlockPolygon = this.createJstsGeometry(json.geometry.coordinates.flat(2));
					for(let i=0; i <= jstsRoutePoints.length - 1; i++) {
						// console.log(i);
						if(i == 0) this.loading = true;
						if(jstsBlockPolygon.contains(jstsRoutePoints[i])) {
							// console.log("BINGO: ", i);
							this.blockInfo.intersect++;
							this.dataLayer.route.overrideStyle(feature, { fillColor: "#8FBC8F" });
							this.loading = false;
							break;
						} else if(i == jstsRoutePoints.length - 1) {
							this.dataLayer.route.overrideStyle(feature, { fillColor: "#DC143C" });
							this.loading = false;
						}
					}
					this.$set(this.blockInfo, "ratio", Math.round(this.blockInfo.intersect / this.blockInfo.total * 10000) / 100);
				});
			})
		},
		intersectCase() {
			const jstsBlockPolygon = this.blockList
				.filter(block => block.roadName == this.listQuery.filterId)
				.map(block => this.createJstsGeometry(JSON.parse(block.geometry).coordinates.flat(2)));

			let featureList = [];
			this.dataLayer.caseNow.forEach(feature => {
				feature.toGeoJson(json => {
					const flatNum = (json.geometry.type == 'MultiLineString') ? 1 : 2;
					const jstsCasePolygon = this.createJstsGeometry(json.geometry.coordinates.flat(flatNum));

					for(let i=0; i <= jstsBlockPolygon.length - 1; i++) {
						// console.log(i);
						if(i == 0) this.loading = true;
						if(jstsCasePolygon.intersects(jstsBlockPolygon[i])) {
							// console.log("BINGO: ", json);
							featureList.push(json);
							// console.log(featureList);
							this.createCaseInfo(featureList);
							this.createCaseList(featureList);
							// this.dataLayer.caseNow.overrideStyle(feature, { strokeColor: "#8FBC8F", strokeWeight: 4 });
							this.loading = false;
							break;
						} else if(i == jstsCasePolygon.length - 1) {
							this.loading = false;
						}
					}
				});
			})
		},
		createJstsGeometry(boundary) {
			// console.log(boundary);
			let coordinates = boundary.map(coord => new jsts.geom.Coordinate(coord[1], coord[0]));

			if (coordinates.length == 1) return this.geometryFactory.createPoint(coordinates[0]);
			else if (coordinates.length >= 4) {
				if(coordinates[0].compareTo(coordinates[coordinates.length-1]) != 0) coordinates.push(coordinates[0]);
				const shell = this.geometryFactory.createLinearRing(coordinates);
				return this.geometryFactory.createPolygon(shell);
			} else {
				return this.geometryFactory.createLineString(coordinates);
			}
		},
		clearAll() {
			// console.log("clearAll");
			this.listQuery.inspectId = 0;
			this.inspectIdList = [];
			this.blockInfo = { total: 0, intersect: 0, ratio: 0 };
			this.panoramaInfo = { data: [], sceneSetting: [], streetViewList: {} };

			this.dataLayer.caseNow.forEach(feature => this.dataLayer.caseNow.remove(feature));
			this.caseGeoJson = {};
			this.caseInfo = [];
			this.caseList = [];

			for(const key in this.polyLine) for(const polyline of this.polyLine[key]) polyline.setMap(null);
			this.polyLine = {};

			this.dataLayer.route.revertStyle();
		},
		handleDownload() {
			let outputCSV = stringify(this.caseList, { header: true });
			const headers = {
				caseId: "Id",
				caseName: "類型",
				caseLevel: "程度",
				place: "地址",
				millingLength: "長",
				millingWidth: "寬",
				millingArea: "面積",
				imgZoomIn: "近照",
				imgZoomOut: "遠照"
			};
			for(const key in headers) {
				outputCSV = outputCSV.replace(key, headers[key]);
			}

			const link = document.createElement('a');
			link.setAttribute("href", "data:text/csv;charset=utf-8,%EF%BB%BF" + encodeURI(outputCSV));
			link.setAttribute("download", `案件列表(${ this.filterIdNow.length != 0 ? this.filterIdNow : this.inspectIdNow == 0 ? '全部' : inspectIdNow }).csv`);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
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
.case-inspection-map
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
		.filter-item
			vertical-align: text-bottom
		.el-select.tender-select
			width: 400px
			.el-input__inner
				padding-left: 8px
				padding-right: 10px
			.el-input__suffix
				right: 0
				margin-right: -3px
				transform: scale(0.7)
	.info-box
		position: absolute
		width: 280px
		// max-height: 70%
		background-color: rgba(white, 0.7)
		z-index: 1
		&.right
			top: 120px
			right: 15px
		&.left
			top: 180px
			left: 15px
		&.chart-1
			width: 320px
			top: 180px
			left: 310px
			background-color: rgba(white, 0.94)
		&.chart-2
			width: 620px
			top: 180px
			left: 640px
			background-color: rgba(white, 0.94)
		.el-card__body
			padding: 2px
			height: 100%
			overflow-x: hidden
			overflow-y: auto
			.color-box
				line-height: 28px
				*
					font-size: 14px
					color: #ECEFF1
					text-shadow: 0px 0px 1px rgba(#263238, 0.6)
			.el-table
				th.gutter
					display: none !important
					width: 0 !important
				colgroup col[name='gutter']
					display: none !important
					width: 0 !important
				.el-table__body
					width: 100% !important
					.el-table__row
						cursor: pointer
						&.highlight-row
							background: #f5f7fa
			.chart
				height: 400px
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
				padding: 0
				margin-left: -5px
				max-height: 100%
				.el-image
					height: 101%
					cursor: pointer
				.case-info
					margin: auto
					& > *
						font-size: 14px
					.case-title
						color: #444
						margin-bottom: 2px
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
	#panorama
		position: absolute
		width: 100％
		height: 100%
		top: 50%
		left: 50%
		transform: translate(-50%, -50%)
		z-index: 10
</style>