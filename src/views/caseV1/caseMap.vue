<template>
	<div class="road-case" v-loading="loading">
		<div id="map" ref="map" />
		<div class="header-bar">
			<h2 class="case-title">缺失地圖</h2>
			<div class="filter-container">
				<div class="filter-item">
					<div class="select-contract el-input el-input--medium el-input-group el-input-group--prepend">
							<div class="el-input-group__prepend">
								<span>合約</span>
							</div>
						<el-select v-model.number="listQuery.tenderRound" class="tender-select" popper-class="type-select tender" @input="changeTender()">
							<el-option v-for="(val, type) in options.tenderRoundMap" :key="type" :label="val.name" :value="Number(type)" />
						</el-select>
					</div>
				</div>
				<br>
				<div class="filter-item filter">
					<div>PCI切塊</div>
					<el-checkbox-group v-model="listQuery.blockType" size="mini" @change="switchBlockType()">
						<el-checkbox-button v-for="(block, type) in options.blockMap" :label="Number(type)" :key="type">{{ block }}</el-checkbox-button>
					</el-checkbox-group>
				</div>
				<div class="filter-item">
					<el-input v-model="listQuery.filterId" placeholder="請輸入">
						<!-- <span slot="prepend">缺失編號</span> -->
						<el-select slot="prepend" v-model="listQuery.filterType" popper-class="type-select">
							<el-option label="缺失編號" :value="1" />
							<el-option label="區塊編號" :value="2" />
						</el-select>
					</el-input>
				</div>
				<el-button class="filter-item" type="primary" size="small" icon="el-icon-search" @click="search()">搜尋</el-button>
				<el-button class="filter-item" type="success" size="small" icon="el-icon-refresh" @click="getList()">載入</el-button>
			</div>
			<span v-if="caseInfo.length != 0" style="background-color: #F2F6FC; margin: 0 5px; opacity: 0.8;">查詢期間：{{ searchRange }}</span>
		</div>

		<!-- <el-card class="info-box right">
			<div class="color-box" v-for="(color, index) in options.colorMap" :key="`color_${index}`"  :style="`background-color: ${color.color}; width: 100%; height: 30px;`">{{ color.name.join("、") }}</div>
		</el-card> -->

		<el-card class="info-box left">
			<el-row :class="[ 'color-box', 'select-all', { 'active' : selectCaseAll } ]" style="margin: 5px 0;">
				<el-col :span="8" :offset="7" style="padding: 0 5px">篩選</el-col>
				<el-col :span="5">
					<el-switch v-model="selectCaseAll" @change="caseFilter()" />
				</el-col>
				<el-col :span="4">
					<el-select v-model.number="selectLevelAll" placeholder="請選擇" size="mini" popper-class="type-select" @change="caseFilter()">
						<el-option :value="-1" label="無" style="display: none" />
						<el-option v-for="order in [0, 3, 2, 1]" :key="order" :value="order" :label="options.levelMap[order]" />
					</el-select>
				</el-col>
			</el-row>
			<el-row :class="[ 'color-box', { 'active' : selectCase[info.caseName].switch } ]" v-for="(info, index) in caseInfo" :key="`caseInfo_${info.caseName}_${index}`"  :style="`background-color: ${info.color}; width: 100%; margin-bottom: 0px`">
				<el-col :span="10" style="padding: 0 5px">{{ String(info.caseName) || " - " }}</el-col>
				<el-col :span="5">
					<span v-if="selectCase[info.caseName].level == 0">{{ info.total }}</span>
					<span v-else>{{ 
						info.level.filter(l => l.caseLevel == options.levelMap[selectCase[info.caseName].level]).length > 0 ?
						info.level.filter(l => l.caseLevel == options.levelMap[selectCase[info.caseName].level])[0].total : 0
					}}</span>
				</el-col>
				<el-col :span="5">
					<el-switch v-model="selectCase[info.caseName].switch" :active-color="info.color" @change="caseFilter()" />
				</el-col>
				<el-col :span="4">
					<el-select v-model="selectCase[info.caseName].level" placeholder="請選擇" size="mini" popper-class="type-select" :disabled="!selectCase[info.caseName].switch" @change="caseFilter()">
						<el-option v-for="order in [0, 3, 2, 1]" :key="order" :value="order" :label="options.levelMap[order]" />
					</el-select>
				</el-col>
			</el-row>
		</el-card>

		<el-image-viewer
			v-if="showImgViewer"
			class="img-preview"
			:on-close="() => { showImgViewer = false; }"
			:url-list="imgUrls"
		/>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
import { Loader } from "@googlemaps/js-api-loader";
import moment from "moment";
import { getDistMap, getTenderRound, getBlockGeo } from "@/api/type";
import { getRoadCaseGeo, setRoadCase } from "@/api/roadV1";
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
	name: "roadCase",
	components: { ElImageViewer },
	data() {
		return {
			loading: false,
			showImgViewer: false,
			screenWidth: window.innerWidth,
			// map: null,
			currCaseId: null,
			imgUrls: [],
			// dataLayer: {},
			infoWindow: null,
			// geoJSON: {},
			caseInfo: [],
			selectCase: {},
			geoJSONFilter: {},
			searchRange: "",
			listQuery: {
				tenderRound: 100001,
				filterType: 1,
				filterId: null,
				blockType: [1]
			},
			headers: {
				caseInfo: {
					caseId: "缺失編號",
					caseName: "缺失類型",
					caseLevel: "損壞程度",
					roadName: "道路名稱",
					length: "長度(m)",
					area: "面積(㎡)",
					depth: "深度(cm)"
				}
			},
			options: { 
				tenderRoundMap : {},
				blockMap: {
					1: "超鉞",
					2: "新工處"
				},
				levelMap: {
					0: "全部",
					1: "輕",
					2: "中",
					3: "重"
				},
				colorMap: [
					{
						index: 0,
						name: ["龜裂"],
						color: "#B71C1C"
					},
					{
						index: 1,
						name: ["裂縫", "縱橫裂縫", "塊狀裂縫"],
						color: "#009688"
					},
					{
						index: 2,
						name: ["坑洞", "人孔高差", "薄層剝離"],
						color: "#FF9800"
					},
					{
						index: 3,
						name: ["車轍"],
						color: "#00BCD4"
					},
					{
						index: 4,
						name: ["補綻", "管線回填"],
						color: "#673AB7"
					},
					{
						index: 5,
						name: ["隆起與凹陷"],
						color: "#8BC34A"
					},
					{	
						index: 6,
						name: ["其他"],
						color: "#607D8B"
					}
				],
				districtMap: {}
			}
		};
	},
	computed: {
		...mapGetters(["blockGeo_bell", "blockGeo_nco"]),
		selectCaseAll: {
			get() {
				const onNum = Object.values(this.selectCase).reduce((acc, cur) => {
					if(cur.switch) acc++;
					return acc;
				}, 0);
				return onNum == this.caseInfo.length;
			},
			set(val) {
				if(val) Object.values(this.selectCase).forEach(caseInfo => caseInfo.switch = true);
				else Object.values(this.selectCase).forEach(caseInfo => caseInfo.switch = false);
			}
		},
		selectLevelAll: {
			get() {
				const selectLevelAll = Object.values(this.selectCase).reduce((acc, cur) => {
					acc[cur.level]++;
					return acc;
				}, { 0: 0, 1: 0, 2: 0, 3: 0 });

				const level = Object.keys(selectLevelAll).filter(key => selectLevelAll[key] == this.caseInfo.length);
				return level.length > 0 ? Number(level[0]) : -1;
			},
			set(val) {
				Object.values(this.selectCase).forEach(caseInfo => caseInfo.level = val);
			}
		}
	},
	watch: { },
	created() {
		this.dataLayer = {  PCIBlock: {} };
		this.geoJSON = {};
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
			await this.initMap();
			if (this.$route.query.caseId) {
				this.listQuery.filterType = 1;
				this.listQuery.filterId = this.$route.query.caseId;
			} else if (this.$route.query.blockId) {
				this.listQuery.filterType = 2;
				this.listQuery.filterId = this.$route.query.blockId;
			}
			await getDistMap().then(response => this.options.districtMap = response.data.districtMap);
			await getTenderRound({ isMap: true }).then(response => {
				this.options.tenderRoundMap = response.data.list.reduce((acc, cur) => {
					let roundId = `${cur.tenderId}${String(cur.round).padStart(3, '0')}`;
					if(cur.zipCodeSpec != 0) roundId += `${cur.zipCodeSpec}`;

					let name = `${cur.tenderName}`;
					if(cur.title.length != 0) name += `_${cur.title}`;
					name += ` Round${cur.round}`;

					acc[roundId] = { 
						name, 
						tenderId: cur.tenderId, 
						isMain: cur.zipCodeSpec == 0,
						zipCode: cur.zipCodeSpec == 0 ? cur.zipCode : cur.zipCodeSpec, 
						roundStart: cur.roundStart, 
						roundEnd: cur.roundEnd
					};
					return acc;
				}, {});

				if(this.$route.query.tenderRound && Object.keys(this.options.tenderRoundMap).includes(String(this.listQuery.tenderRound))) this.listQuery.tenderRound = Number(this.$route.query.tenderRound);
				else if(!Object.keys(this.options.tenderRoundMap).includes(String(this.listQuery.tenderRound))) this.listQuery.tenderRound = Number(Object.keys(this.options.tenderRoundMap)[0]);
				this.changeTender(true);
			});
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
				this.infoWindow.addListener('domready', () => {
					const infoDelBtn = this.$el.querySelector("#map #info-del-btn");
					if(infoDelBtn) {
						const clickHandle = infoDelBtn.addEventListener("click", () => { 
							this.removeCaseStatus();
							infoDelBtn.removeEventListener("click", clickHandle);
						});
					}

					const infoScrnFullBtn = this.$el.querySelector("#map #info-scrn-full-btn");
					if(infoScrnFullBtn) {
						const clickHandle = infoScrnFullBtn.addEventListener("click", () => { 
							this.showImgViewer = true;
							infoScrnFullBtn.removeEventListener("click", clickHandle);
						});
					}
				});
				resolve();

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

				// 載入切塊GeoJson
				// const zipCode = this.options.tenderRoundMap[this.listQuery.tenderRound].zipCode;
				this.dataLayer.PCIBlock.bell = new google.maps.Data();
				// this.dataLayer.PCIBlock.bell.loadGeoJson(`/assets/json/PCIBlock_${zipCode}.geojson?t=${Date.now()}`, null, () => {
				// 	this.switchBlockType();
				// 	this.search();
				// });
				this.dataLayer.PCIBlock.bell.setStyle({ 
					strokeColor: '#FFF',
					strokeWeight: 1,
					strokeOpacity: 1,
					fillColor: '#2196F3',
					fillOpacity: 0.1,
					zIndex: 1
				});

				this.dataLayer.PCIBlock.nco = new google.maps.Data();
				// this.dataLayer.PCIBlock.nco.loadGeoJson(`/assets/json/PCIBlock_nco_${zipCode}.geojson?t=${Date.now()}`);
				this.dataLayer.PCIBlock.nco.setStyle({ 
					strokeColor: '#78909C',
					strokeWeight: 2,
					strokeOpacity: 0.4,
					fillOpacity: 0,
					zIndex: 2
				});

				this.map.data.setStyle(feature => { 
					// console.log(feature.getProperty("caseName"));
					let color = this.options.colorMap.filter(color => color.name == '其他')[0].color;
					if(feature.getProperty("caseName")) {
						const colorFilter = this.options.colorMap.filter(color => {
							let caseFlag = false;
							for(const name of color.name) {
								caseFlag = (feature.getProperty("caseName").indexOf(name) != -1);
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
						const caseLevelMap = { "重": "H", "中": "M", "輕": "L"  };
						return { 
							icon: { 
								url: `/assets/icon/icon_case_${caseLevelMap[feature.getProperty("caseLevel")]}.png`,
								anchor: new google.maps.Point(5, 5),
								scaledSize: new google.maps.Size(25, 25),
							},
							zIndex: feature.getProperty("isLine") ? 1000 - feature.getProperty("length") : 1000 - feature.getProperty("area")
						};
					} else if(feature.getProperty("isLine")) {
						return { 
							strokeColor: color,
							strokeWeight: 3,
							strokeOpacity: 1,
							fillOpacity: 0,
							zIndex: 1000 - feature.getProperty("length")
						};
					} else {
						return { 
							strokeColor: color,
							strokeWeight: 1,
							strokeOpacity: 1,
							fillColor: color,
							fillOpacity: 0.8,
							zIndex: 1000 - feature.getProperty("area")
						};
					}
				});

				this.map.data.addListener('click', (event) => {
					// console.log("click: ", event);
					// console.log(this.currCaseId);
					this.showCaseContent(event.feature, event.latLng);
				});
			})
		},
		changeTender() {
			const zipCode = this.options.tenderRoundMap[this.listQuery.tenderRound].zipCode;

			this.dataLayer.district.setStyle(feature => {
				// console.log(feature);
				const condition = zipCode == 1001 || this.options.districtMap[zipCode].district.includes(feature.getProperty("TOWNNAME"));

				return {
					strokeColor: "#827717",
					strokeWeight: 3,
					strokeOpacity: 0.2,
					fillColor: "#000000",
					fillOpacity: condition ? 0 : 0.7,
					zIndex: 0
				}
			});

			const bounds = new google.maps.LatLngBounds();
			const boundary = JSON.parse(this.options.districtMap[zipCode].boundary);
			boundary.coordinates.flat().forEach(position => bounds.extend({ lat: position[1], lng: position[0] }));
			this.map.fitBounds(bounds);

			this.$router.push({ query: { ...this.$route.query , tenderRound: this.listQuery.tenderRound } });
			// this.getList();
		},
		getGeoJSONFilter() {
			this.geoJSONFilter = { features: [] };
			if(this.geoJSON.case != undefined && Object.keys(this.geoJSON.case).length > 0) {
				this.geoJSONFilter = JSON.parse(JSON.stringify(this.geoJSON.case));
				const selectCaseList = Object.keys(this.selectCase).filter(caseName => this.selectCase[caseName].switch);
				const selectCaseLvMap = selectCaseList.reduce((acc, cur) => { 
					acc[cur] = this.selectCase[cur].level == 0 ? this.selectCase[cur].level : this.options.levelMap[this.selectCase[cur].level];
					return acc
				}, {});

				this.geoJSONFilter.features = this.geoJSONFilter.features.filter(feature => {
					const caseName = feature.properties.caseName;
					const caseLevel = feature.properties.caseLevel;
					const levelFilter= selectCaseLvMap[feature.properties.caseName];

					return (selectCaseList.includes(caseName)) && (levelFilter == 0 || caseLevel == levelFilter);
				});
			}
		},
		async getList() {
			this.loading = true;
			this.clearAll();
			this.caseInfo = [];
			this.selectCase = {};

			const tenderRound = this.options.tenderRoundMap[this.listQuery.tenderRound];
			const startDate = moment(tenderRound.roundStart).format("YYYY-MM-DD");
			const endDate = moment(tenderRound.roundEnd).format("YYYY-MM-DD");
			this.searchRange = startDate + " - " + endDate;

			// 載入缺失
			await getRoadCaseGeo({
				tenderId: tenderRound.tenderId,
				zipCode: tenderRound.isMain ? 0 : tenderRound.zipCode,
				timeStart: startDate,
				timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD")
			}).then(async (response) => {
				if(response.data.geoJSON.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					// 載入區塊
					if(!this.blockGeo_bell[this.listQuery.tenderRound] || this.blockGeo_bell[this.listQuery.tenderRound].length == 0 
						|| !this.blockGeo_nco[this.listQuery.tenderRound] || this.blockGeo_nco[this.listQuery.tenderRound].length == 0 ) await this.getBlock();
					else {
						this.geoJSON.block = {
							block_bell: JSON.parse(this.blockGeo_bell[this.listQuery.tenderRound]),
							block_nco: JSON.parse(this.blockGeo_nco[this.listQuery.tenderRound])
						};
						this.dataLayer.PCIBlock.bell.addGeoJson(this.geoJSON.block.block_bell);
						this.dataLayer.PCIBlock.nco.addGeoJson(this.geoJSON.block.block_nco);
						this.switchBlockType();
						if(this.$route.query.blockId) this.search();
					}
					
					this.caseInfo = response.data.summary;
					this.caseInfo.forEach(info => {
						let color = this.options.colorMap.filter(color => color.name == '其他')[0].color;
						let index = this.options.colorMap.filter(color => color.name == '其他')[0].index;
						if(info.caseName) {
							const colorFilter = this.options.colorMap.filter(color => {
								let caseFlag = false;
								for(const name of color.name) {
									caseFlag = (info.caseName.indexOf(name) != -1);
									// console.log(info.caseName, name, caseFlag);
									if(caseFlag) break;
								}

								return caseFlag; 
							})
							// console.log(colorFilter);
							
							if(colorFilter.length > 0) {
								color = colorFilter[0].color;
								index = colorFilter[0].index;
							}
						}

						this.$set(info, "color", color);
						this.$set(info, "index", index);
						// console.log(JSON.stringify(info));
						this.$set(this.selectCase, info.caseName, { switch: true, level: 0 });
					})

					this.caseInfo.sort((a, b) => (a.index - b.index));

					this.geoJSON.case = JSON.parse(response.data.geoJSON);
					// console.log(this.geoJSON.case);
					this.getGeoJSONFilter();
					this.map.data.addGeoJson(this.geoJSON.case);
				}
				// this.switchBlockType();
				if(this.$route.query.caseId) await this.search();
				else this.loading = false;

				// if(isCompleted) this.loading = false;
				// else isCompleted = true;
			}).catch(err => this.loading = false);
		},
		getBlock() {
			const tenderRound = this.options.tenderRoundMap[this.listQuery.tenderRound];

			let blockType = [];
			if(!this.blockGeo_bell[this.listQuery.tenderRound] || this.blockGeo_bell[this.listQuery.tenderRound].length == 0) blockType.push(1);
			if(!this.blockGeo_nco[this.listQuery.tenderRound] || this.blockGeo_nco[this.listQuery.tenderRound].length == 0 ) blockType.push(2);

			return new Promise((resolve, reject) => {
				getBlockGeo({ 
					tenderId: tenderRound.tenderId,
					zipCode: tenderRound.isMain ? 0 : tenderRound.zipCode,
					blockType
				}).then(async (response) => {
					if(response.data.geoJSON.length == 0) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
					} else {
						this.geoJSON.block = JSON.parse(response.data.geoJSON);

						if(blockType.includes(1)) {
							if(this.blockGeo_nco[this.listQuery.tenderRound] && this.blockGeo_nco[this.listQuery.tenderRound].length != 0 ) this.geoJSON.block.block_nco = JSON.parse(this.blockGeo_nco[this.listQuery.tenderRound]);
							this.$store.dispatch('block/setGeoJSON_bell', { 
								tenderRound: this.listQuery.tenderRound, 
								JSONString: JSON.stringify(this.geoJSON.block.block_bell)
							});
						}

						if(blockType.includes(2)) {
							if(this.blockGeo_bell[this.listQuery.tenderRound] && this.blockGeo_bell[this.listQuery.tenderRound].length != 0) this.geoJSON.block.block_bell = JSON.parse(this.blockGeo_bell[this.listQuery.tenderRound]);
							this.$store.dispatch('block/setGeoJSON_nco', { 
								tenderRound: this.listQuery.tenderRound, 
								JSONString: JSON.stringify(this.geoJSON.block.block_nco)
							});
						}
						
						this.dataLayer.PCIBlock.bell.addGeoJson(this.geoJSON.block.block_bell);
						this.dataLayer.PCIBlock.nco.addGeoJson(this.geoJSON.block.block_nco);

						this.switchBlockType();
						if(this.$route.query.blockId) this.search();

						// if(isCompleted) this.loading = false;
						// else isCompleted = true;

						// this.loading = false;
						resolve();
					}
				})
			})
		},
		removeCaseStatus() {
			// console.log(this.currCaseId);
			const tenderRound = this.options.tenderRoundMap[this.listQuery.tenderRound];
			setRoadCase(this.currCaseId, { tenderId: tenderRound.tenderId, type: 8 }).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "修改成功",
						type: "success",
					});
					this.getList();
				} else {
					this.$message({
						message: "修改失敗",
						type: "error",
					});
				}
			}).catch(err => {
				console.log(err);
				this.getList();
			})
		},
		async switchBlockType() {
			for(const block of Object.values(this.dataLayer.PCIBlock)) {
				block.revertStyle();
				block.setMap(null);
			}

			if(this.listQuery.blockType.includes(1)) this.dataLayer.PCIBlock.bell.setMap(this.map);
			if(this.listQuery.blockType.includes(2)) this.dataLayer.PCIBlock.nco.setMap(this.map);
		},
		caseFilter() {
			this.clearAll(false);
			this.getGeoJSONFilter();
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
				for(const block of Object.values(this.dataLayer.PCIBlock)) block.revertStyle();

				if(!this.listQuery.filterId || this.listQuery.filterId.length == 0) resolve();
				else if(this.listQuery.filterId.length != 0 && !Number(this.listQuery.filterId)) {
					this.$message({
						message: "請輸入正確編號",
						type: "error",
					});
					resolve();
				} else if(this.listQuery.filterType == 1) {
					this.$router.push({ query: { tenderRound: this.listQuery.tenderRound, caseId: this.listQuery.filterId }});
					const caseSpec = this.geoJSONFilter.features.filter(feature => (feature.properties.caseId == this.listQuery.filterId))[0];
					if(caseSpec == undefined ) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
						resolve();
					} else if(caseSpec.properties.isPoint) {
						this.map.setCenter({ lat: caseSpec.geometry.coordinates[1], lng: caseSpec.geometry.coordinates[0] });
						const zoom = this.map.getZoom();
						this.map.setZoom(zoom < 21 ? 21 : zoom);
						this.showCaseContent(caseSpec.properties, { lat: caseSpec.geometry.coordinates[1], lng: caseSpec.geometry.coordinates[0] });
						resolve();
					} else {
						const depth = caseSpec.properties.isLine ? 1 : 2;
						// console.log(caseSpec.properties.isLine, depth);
						const paths = caseSpec.geometry.coordinates.flat(depth).map(point => ({ lat: point[1], lng: point[0] }));
						// console.log(paths);

						const bounds = new google.maps.LatLngBounds();
						paths.forEach(position => bounds.extend(position));
						this.map.fitBounds(bounds);
						this.showCaseContent(caseSpec.properties, paths[Math.floor(paths.length / 2)]);
						resolve();
					}
				} else if(this.listQuery.filterType == 2) {
					this.$router.push({ query: { tenderRound: this.listQuery.tenderRound, blockId: this.listQuery.filterId }});

					let blockSpec;
					for(const[ key, block ] of Object.entries(this.dataLayer.PCIBlock)) {
						// console.log(key, block);
						block.forEach(features =>{ 
							// let blockType = (key == 'bell') ? 'pci_id' : 'fcl_id' ;
							if(features.getProperty("blockId") == this.listQuery.filterId) blockSpec = features;
						});
						
						if(blockSpec != undefined ) {
							if(key == 'bell') this.listQuery.blockType = [ 1 ];
							else if(key == 'nco') this.listQuery.blockType = [ 2 ];
							this.switchBlockType();

							block.overrideStyle(blockSpec, { strokeColor: "#FF6F00", zIndex: 3 });
							break;
						}
					}

					// for(const block of ['block_nco', 'block_104']) {
					// 	blockSpec = this.geoJSON[block].features.filter(feature => (feature.properties.blockId == this.listQuery.filterId))[0];
					// 	if(blockSpec != undefined ) break;
					// }
					// console.log(blockSpec);
					if(blockSpec == undefined ) {
						this.$message({
							message: "查無資料",
							type: "error",
						});

						resolve();
					} else {
						// const paths = blockSpec.geometry.coordinates.flat(2).map(point => ({ lat: point[1], lng: point[0] }));
						const paths = blockSpec.getGeometry();
						// console.log(paths);

						const bounds = new google.maps.LatLngBounds();
						// paths.forEach(position => bounds.extend(position));
						paths.forEachLatLng(position => bounds.extend(position));
						this.map.fitBounds(bounds);

						resolve();
					}
				}
			})
		},
		showCaseContent(props, position) {
			const isFeature = google.maps.Data.Feature.prototype.isPrototypeOf(props);
			this.currCaseId = isFeature ? props.getProperty("caseId") : props.caseId;
			this.imgUrls = [ `https://img.bellsgis.com/images/online_pic/${this.currCaseId}.jpg` ];
			let contentText = `<div style="width: 400px;">`;
			for(const key in this.headers.caseInfo) {
				if(props[key] || (isFeature && props.getProperty(key))) {
					const prop = isFeature ? props.getProperty(key) : props[key];
					contentText += `<div class="el-row" style="margin-bottom: 4px">`;
					contentText += `<div class="el-col el-col-8" style="padding-left: 5px; font-size: 18px; line-height: 18px;">${this.headers.caseInfo[key]}</div>`;
					contentText += `<div class="el-col el-col-16" style="font-size: 18px; line-height: 18px;">${prop}</div>`;
					contentText += `</div>`;
				}
			}
			// for(const img of event.feature.getProperty("img")) {
			// 	contentText += `<img src="https://img.bellsgis.com/images/casepic_o/${img}" style="object-fit: scale-down;">`
			// }
			contentText += `<button type="button" id="info-del-btn" class="info-btn del el-button el-button--default" style="height: 20px; width: 40px;"><span class="btn-text">刪除</span></button>`;
			contentText += `<img src="https://img.bellsgis.com/images/online_pic/${this.currCaseId}.jpg" class="img" onerror="this.className='img hide-img'">`;
			contentText += `<button type="button" id="info-scrn-full-btn" class="info-btn scrn-full el-button el-button--default" style="height: 30px; width: 30px;"><i class="el-icon-full-screen btn-text"></i></button></img>`;
			contentText += `</div>`;
			// console.log(contentText);
			this.infoWindow.setContent(contentText);
			this.infoWindow.setOptions({ pixelOffset: new google.maps.Size(0, -10)});
			this.infoWindow.setPosition(position);

			this.infoWindow.open(this.map);
		},
		clearAll(clearBlock = true) {
			// for(const block of Object.values(this.dataLayer.PCIBlock)) {
			// 	block.revertStyle();
			// 	block.setMap(null);
			// }
			if(clearBlock) {
				this.dataLayer.PCIBlock.bell.forEach(feature => this.dataLayer.PCIBlock.bell.remove(feature));
				this.dataLayer.PCIBlock.nco.forEach(feature => this.dataLayer.PCIBlock.nco.remove(feature));
			}

			this.infoWindow.close();
			this.map.data.forEach(feature => this.map.data.remove(feature));
		},
		formatter(row, column) {
			if (Number(row[column.property])) return row[column.property].toLocaleString();
			else return row[column.property] || "-";
		},
		formatTime(time) {
			return moment(time).utc().format("YYYY-MM-DD");
		}
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.road-case
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
				// background-color: white
		.el-select
			width: 85px
			.el-input__inner
				padding-left: 8px
				padding-right: 10px
			.el-input__suffix
				right: 0
				margin-right: -3px
				transform: scale(0.7)
		.select-contract
			.el-select
				&.tender-select
					width: 520px
				.el-input__inner
					border-top-left-radius: 0
					border-bottom-left-radius: 0
					padding-left: 10px
					text-align: left
	.info-box
		position: absolute
		width: 250px
		background-color: rgba(white, 0.7)
		z-index: 1
		&.left
			top: 200px
			left: 15px
		.el-card__body
			padding: 2px
			.color-box
				line-height: 30px
				*
					color: #C0C4CC
				&.active *
					color: #FFF
				&.select-all 
					*
						color: #606266
					&.active *
						color: #409EFF
			.el-switch .el-switch__core
				border: 1px solid #DCDFE6 !important
			.el-select
				width: 38px
				.el-input__inner
					padding: 0
					text-align: center
					background-color: transparent
					color: #FFF
				.el-input__suffix
					display: none
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