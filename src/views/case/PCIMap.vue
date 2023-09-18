<template>
	<div class="PCI-map" v-loading="loading">
		<div id="map" ref="map" />
		<div class="header-bar">
			<h2 class="map-title">查核地圖</h2>
			<div class="filter-container">
				<div class="filter-item">
					<div class="select-contract el-input el-input--medium el-input-group el-input-group--prepend">
						<div class="el-input-group__prepend">
							<span>合約</span>
						</div>
						<el-select v-model="listQuery.tenderRound" class="tender-select" placeholder="請選擇" popper-class="type-select tender" @input="changeTender()">
							<el-option v-for="(val, type) in options.tenderRoundMap" :key="type" :label="val.name" :value="Number(type)" />
						</el-select>
					</div>
				</div>
				<br>
				<div class="filter-item">
					<el-input v-model="listQuery.filterId" placeholder="請輸入">
						<!-- <span slot="prepend">缺失編號</span> -->
						<el-select slot="prepend" v-model="listQuery.filterType" popper-class="type-select">
							<el-option label="區塊編號" :value="1" />
							<el-option label="道路名稱" :value="2" />
						</el-select>
					</el-input>
				</div>
				<el-button class="filter-item" type="primary" size="small" icon="el-icon-search" @click="search()">搜尋</el-button>
				<el-button class="filter-item" type="success" size="small" icon="el-icon-refresh" @click="getList()">載入</el-button>
				<el-button v-if="hasClearOverlay" class="filter-item" type="danger" size="small" icon="el-icon-delete" @click="clearOverlay()">清除正射</el-button>
			</div>
		</div>

		<!-- <el-card class="info-box right">
			<div class="color-box" v-for="(color, index) in options.colorMap" :key="`color_${index}`"  :style="`background-color: ${color.color}; width: 100%; height: 30px;`">{{ color.name.join("、") }}</div>
		</el-card> -->

		<div class="info-box left">
			<el-card>
				<el-collapse>
					<el-collapse-item class="collapse-label" title="鋪面狀況指數">
						<!-- TODO: 關閉鋪面圖層 -->
						<el-row slot="title">
							<el-col :span="18">鋪面狀況指數</el-col>
							<el-col :span="6">
								<el-switch v-model="blockSwitch" @change="switchBlock()" onclick="(function(e) { e.stopPropagation() }(event))" />
							</el-col>
						</el-row>
						<el-row class="color-box" v-for="key in [ 6, 5, 4, 3, 2, 1, 0 ]" :key="`PCILevel_${key}`"  :style="`background-color: ${options.PCILevel[key].color}; width: 100%; margin-bottom: 0px`">
							<el-col :span="7" style="padding: 0 5px">{{ options.PCILevel[key].description }}</el-col>
							<el-col :span="7">({{ options.PCILevel[key].range[0] }} - {{ options.PCILevel[key].range[1] }})</el-col>
							<el-col :span="10">{{ options.PCILevel[key].total }}</el-col>
						</el-row>
					</el-collapse-item>
					<el-collapse-item class="collapse-label" title="缺失類型">
						<el-row slot="title">
							<el-col :span="18">缺失類型</el-col>
							<el-col :span="6">
								<el-switch v-model="caseSwitch" @change="switchCase()" onclick="(function(e) { e.stopPropagation() }(event))" />
							</el-col>
						</el-row>
						<el-row :class="[ 'color-box', { 'active' : selectCase[info.caseName].switch } ]" v-for="(info, index) in caseInfo" :key="`caseInfo_${index}`"  :style="`background-color: ${info.color}; width: 100%; margin-bottom: 0px`">
							<el-col :span="10" style="padding: 0 5px">{{ String(info.caseName) || " - " }}</el-col>
							<el-col :span="14">{{ info.total }}</el-col>
						</el-row>
					</el-collapse-item>
				</el-collapse>
			</el-card>
		</div>

		<el-image-viewer
			v-if="showImgViewer"
			class="img-preview"
			:on-close="() => { showImgViewer = false; }"
			:url-list="imgUrls"
		/>

		<el-dialog class="dialog-map" :visible.sync="showCaseList" width="640px">
			<el-table :data="caseList" border>
				<el-table-column
					v-for="(value, key) in headers.caseList"
					:key="key"
					:prop="key"
					:label="value.name"
					align="center"
					:sortable="value.sortable"
					:formatter="formatter"
				/>
			</el-table>
		</el-dialog>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
import { Loader } from "@googlemaps/js-api-loader";
import { fromUrl, Pool } from "geotiff";
import moment from "moment";
import proj4 from 'proj4';
import { getDistMap, getTenderRound, getBlockGeo } from "@/api/type";
import { getBlockPCI, getBlockPCIArchive, getRoadCaseGeo, getBlockCase } from "@/api/road";
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

//定義常用座標系統
// WGS84
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");
//TWD97 TM2
proj4.defs("EPSG:3826", "+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

export default {
	name: "PCIMap",
	components: { ElImageViewer },
	data() {
		return {
			loading: false,
			showCaseList: false,
			showImgViewer: false,
			hasClearOverlay: false,
			blockSwitch: true,
			caseSwitch: false,
			screenWidth: window.innerWidth,
			blockInfo: {
				id: 0,
				feature: null
			},
			pciId: 0,
			// map: null,
			imgUrls: [],
			// dataLayer: {},
			// overlayLayer: {},
			infoWindow: null,
			// geoJSON: {},
			caseInfo: [],
			selectCase: {},
			listQuery: {
				tenderRound: null,
				filterType: 1,
				filterId: null
			},
			headers: {
				caseList: {
					caseId: {
						name: "缺失編號",
						sortable: true,
					},
					distressType: {
						name: "缺失類型",
						sortable: true,
					},
					distressLevel: {
						name: "損壞程度",
						sortable: true,
					},
					caseLength: {
						name: "長度(m)",
						sortable: true,
					},
					caseArea: {
						name: "面積(㎡)",
						sortable: true,
					}
				},
				content: {
					// caseInfo
					caseId: "缺失編號",
					caseName: "缺失類型",
					caseLevel: "損壞程度",
					length: "長度(m)",
					depth: "深度(cm)",

					// PCIInfo
					pciId: "區塊編號",
					roadName: "道路名稱",
					area: "面積(㎡)",
					PCIValue: "PCI",

					updateTime: "更新時間"
				}
			},
			caseList: [],
			options: { 
				tenderRoundMap : {},
				PCILevel: {
					6: {
						text: "veryGood",
						description: "很好",
						range: [ 85, 100 ],
						color: "#00B900",
						total: 0
					},
					5: {
						text: "good",
						description: "好",
						range: [ 70, 85 ],
						color: "#C1FE00",
						total: 0
					},
					4: {
						text: "fair",
						description: "尚可",
						range: [ 55, 70 ],
						color: "#FEFE00",
						total: 0
					},
					3: {
						text: "poor",
						description: "差",
						range: [ 40, 55 ],
						color: "#F40088",
						total: 0
					},
					2: {
						text: "veryPoor",
						description: "很差",
						range: [ 25, 40 ],
						color: "#F40000",
						total: 0
					},
					1: {
						text: "serious",
						description: "嚴重",
						range: [ 10, 25 ],
						color: "#A72126",
						total: 0
					},
					0: {
						text: "failed",
						description: "不合格",
						range: [ 0, 10 ],
						color: "#666666",
						total: 0
					},
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
		...mapGetters(["blockGeo_bell"])
	},
	watch: { },
	created() {
		this.dataLayer = { PCIBlock: {} };
		this.overlayLayer = {};
		this.geoJSON = {};
		this.geoTiffPool = new Pool();
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
			if (this.$route.query.pciId) {
				this.listQuery.filterType = 1;
				this.listQuery.filterId = this.$route.query.pciId;
			} else if (this.$route.query.roadName) {
				this.listQuery.filterType = 2;
				this.listQuery.filterId = this.$route.query.roadName;
			}
			await getDistMap().then(response => this.options.districtMap = response.data.districtMap);
			getTenderRound({ isMap: true }).then(response => {
				this.options.tenderRoundMap = response.data.list.reduce((acc, cur) => {
					let roundId = `${cur.tenderId}${String(cur.round).padStart(3, '0')}`;
					if(cur.zipCodeSpec != 0) roundId += `${cur.zipCodeSpec}`;

					let name = `${cur.tenderName}`;
					if(cur.title.length != 0) name += `_${cur.title}`;
					name += ` Round${cur.round}`;
					if(cur.archiveTime) name += ` (已封存)`

					acc[roundId] = { 
						name, 
						id: cur.id,
						tenderId: cur.tenderId, 
						isMain: cur.zipCodeSpec == 0,
						isArchive: Boolean(cur.archiveTime),
						zipCode: cur.zipCodeSpec == 0 ? cur.zipCode : cur.zipCodeSpec, 
						roundStart: cur.roundStart, 
						roundEnd: cur.roundEnd,
						orthoPath: cur.orthoPath
					};
					return acc;
				}, {});

				// if(this.$route.query.tenderRound && Object.keys(this.options.tenderRoundMap).includes(String(this.$route.query.tenderRound))) this.listQuery.tenderRound = Number(this.$route.query.tenderRound);
				// else if(!Object.keys(this.options.tenderRoundMap).includes(String(this.listQuery.tenderRound))) this.listQuery.tenderRound = Number(Object.keys(this.options.tenderRoundMap)[0]);
				// this.changeTender();
			});
		}).catch(err => console.log("err: ", err));
	},
	methods: {
		// init google map
		async initMap() {
			return new Promise(resolve => {
				// console.log("initMap");

				// 宣告自定義疊加層 MapImgOverlay
				class MapImgOverlay extends google.maps.OverlayView {
					map;
					layer;
					div;
					img;
					bounds;
					imgUrl;
					constructor(bounds, imgUrl, map) {
						super();
						// this.img = document.createElement("img");
						this.bounds = bounds;
						this.imgUrl = imgUrl;
						this.map = map;
						this.setMap(this.map);
					}
					/**
					 * onAdd is called when the map's panes are ready and the overlay has been
					 * added to the map.
					 */
					onAdd() {
						this.div = document.createElement("div");
						this.div.style.borderStyle = "none";
						this.div.style.borderWidth = "0px";
						this.div.style.position = "absolute";
						// this.div.style.zIndex = 100;

						// Create the img element and attach it to the div.
						this.img = document.createElement("img");
						this.img.onload = () => {
							// console.log(this.img.naturalWidth, this.img.naturalHeight);
							if(this.map != undefined) {
								// this.map.fitBounds(this.bounds);
								this.map.panBy(0.01, 0);
								this.map.panBy(-0.01, 0);
							}
						};
						this.img.onerror = () => {
							console.log("Load Error:", this.img.src); 
							this.img.style.display = 'none';

							if(this.map != undefined) {
								// this.map.fitBounds(this.bounds);
								this.map.panBy(0.01, 0);
								this.map.panBy(-0.01, 0);
							}
						};

						this.img.src = this.imgUrl;
						this.img.style.width = "100%";
						this.img.style.height = "100%";
						this.img.style.position = "absolute";
						this.img.style.mixBlendMode = "darken";
						// img.style.zIndex = 100;
						this.div.appendChild(this.img);

						// Add the element to the "overlayLayer" pane.
						const panes = this.getPanes();
						panes.overlayLayer.appendChild(this.div);
					}
					draw() {
						// We use the south-west and north-east
						// coordinates of the overlay to peg it to the correct position and size.
						// To do this, we need to retrieve the projection from the overlay.
						const overlayProjection = this.getProjection();
						// Retrieve the south-west and north-east coordinates of this overlay
						// in LatLngs and convert them to pixel coordinates.
						// We'll use these coordinates to resize the div.
						const sw = overlayProjection.fromLatLngToDivPixel(
							this.bounds.getSouthWest()
						);
						const ne = overlayProjection.fromLatLngToDivPixel(
							this.bounds.getNorthEast()
						);

						// Resize the image's div to fit the indicated dimensions.
						if (this.div) {
							this.div.style.left = sw.x + "px";
							this.div.style.top = ne.y + "px";
							this.div.style.width = ne.x - sw.x + "px";
							this.div.style.height = sw.y - ne.y + "px";
						}
					}
					/**
					 * The onRemove() method will be called automatically from the API if
					 * we ever set the overlay's map property to 'null'.
					 */
					onRemove() {
						if (this.div) {
							// this.div.parentNode.removeChild(this.img);
							this.img.remove();
							delete this.img;

							// this.div.parentNode.removeChild(this.div);
							this.div.remove();
							delete this.div;
						}
					}
					checkImg() {
						// console.log(this.img.complete);
						// console.log(this.img.naturalWidth, this.img.naturalHeight);
						return this.img.complete && this.img.naturalWidth !== 0 ;
					}
				}

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
					// maxZoom: 24,
					// minZoom: 12,
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
					const infoScrnFullBtn = this.$el.querySelector("#map #info-scrn-full-btn");
					if(infoScrnFullBtn) {
						const clickHandle = infoScrnFullBtn.addEventListener("click", () => { 
							if(this.blockInfo.id != 0) {
								if(this.overlayLayer[this.blockInfo.id] != undefined) return; 

								const orthoPath = this.options.tenderRoundMap[this.listQuery.tenderRound].orthoPath;
								const imgSrc = `${orthoPath}${this.blockInfo.id}.jpeg?t=${Date.now()}`;
								const bounds = new google.maps.LatLngBounds();
								this.blockInfo.feature.getGeometry().forEachLatLng(point => bounds.extend(point));

								const overlay = new MapImgOverlay(bounds, imgSrc, this.map);
								// this.$set(this.overlayLayer, this.blockInfo.id, overlay);
								this.overlayLayer[this.blockInfo.id] = overlay;

								google.maps.event.addListenerOnce(this.map, 'idle', () => {
									if(overlay.checkImg()) {
										this.hasClearOverlay = true;
										this.$el.querySelector("#map #info-scrn-full-btn").style.opacity = "1";
										this.$el.querySelector("#map #info-download-btn").style.opacity = "1";
										this.infoWindow.close();
										
										const PCISpec = this.blockInfo.feature.getProperty("PCIValue");
										let filterLevel = [];
										if(PCISpec == -1) filterLevel = [[ "-1", { description: "不合格", color: '#666666' }]];
										else if(PCISpec == 100) filterLevel = [[ "6", { description: "很好", color: '#00B900' }]];
										else filterLevel = Object.entries(this.options.PCILevel).filter(([key, level]) => {	
											return PCISpec >= level.range[0] && PCISpec < level.range[1]
										});

										this.dataLayer.PCIBlock.overrideStyle(
											this.blockInfo.feature, 
											{ 
												fillOpacity: 0, 
												strokeColor: filterLevel[0][1].color, 
												strokeOpacity: 0.4,
												strokeWeight: 2,
												zIndex: 3 
											});
									} else {
										overlay.setMap(null);
										this.$delete(this.overlayLayer, this.blockInfo.id);

										this.$el.querySelector("#map #info-scrn-full-btn").style.display = "none";
										this.$el.querySelector("#map #info-download-btn").style.display = "none";

										this.$message({
											message: "尚無正射圖",
											type: "error",
										});
									}
									// this.loading = false;
									infoScrnFullBtn.removeEventListener("click", clickHandle);
								});
							}
						});
					}

					const caseListBtn = this.$el.querySelector("#map #case-list-btn");
					if(caseListBtn) {
						const clickHandle = caseListBtn.addEventListener("click", () => { 
							this.caseList = [];
							if(this.blockInfo.id != 0) {
								this.loading = true;
								const tenderRound = this.options.tenderRoundMap[this.listQuery.tenderRound];
								
								getBlockCase({
									tenderId: tenderRound.tenderId,
									surveyId: tenderRound.id,
									blockId: this.pciId
								}).then(response => {
									this.caseList = response.data.list;
									this.showCaseList = true;
									this.loading = false;
								}).catch(err => this.loading = false);
							} else this.showCaseList = true;
							caseListBtn.removeEventListener("click", clickHandle);
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

				this.dataLayer.PCIBlock = new google.maps.Data({ map: this.map });
				this.dataLayer.PCIBlock.setStyle(feature => {
					const PCISpec = feature.getProperty("PCIValue");
					let  filterLevel = [];
					if(PCISpec == -1) filterLevel = [[ "-1", { description: "不合格", color: '#666666' }]];
					else if(PCISpec == 100) filterLevel = [[ "6", { description: "很好", color: '#00B900' }]];
					else filterLevel = Object.entries(this.options.PCILevel).filter(([key, level]) => {	
						// console.log(level, PCISpec);
						return PCISpec >= level.range[0] && PCISpec < level.range[1]
					});
					// console.log(filterLevel);

					return {
						strokeColor: '#FFF',
						strokeWeight: 1,
						strokeOpacity: 1,
						fillColor: filterLevel[0][1].color,
						fillOpacity: filterLevel[0][0] != -1 ? 1 - filterLevel[0][0] * 0.1 : 0.4,
						zIndex: filterLevel[0][0] != -1 ? 2 : 1
					}
				});

				this.dataLayer.PCIBlock.addListener('click', (event) => {
					this.showContent(event.feature, event.latLng);
				});

				// TODO: 右鍵顯示「正射」 (測試-jpg)
				// this.dataLayer.PCIBlock.addListener('rightclick', (event) => {
				// 	// console.log(event.feature);
				// 	// this.loading = true;
				// 	const blockId = event.feature.getProperty("blockId");
				// 	const imgSrc = `https://storage.googleapis.com/demo-freeway20200701/orthos_test/${blockId}.jpeg`;

				// 	const bounds = new google.maps.LatLngBounds();
				// 	event.feature.getGeometry().forEachLatLng(point => bounds.extend(point));
				// 	// new google.maps.GroundOverlay( imgSrc, bounds, { map: this.map } );
				// 	const overlay = new MapImgOverlay(bounds, imgSrc, this.map);
				// 	if(this.overlayLayer[blockId] != undefined) return; 
				// 	this.overlayLayer[blockId] = overlay;

				// 	google.maps.event.addListenerOnce(this.map, 'idle', () => {
				// 		if(overlay.checkImg()) {
				// 			const PCISpec = event.feature.getProperty("PCIValue");
				// 			let  filterLevel = [];
				// 			if(PCISpec == -1) filterLevel = [[ "-1", { description: "不合格", color: '#666666' }]];
				// 			else if(PCISpec == 100) filterLevel = [[ "6", { description: "很好", color: '#00B900' }]];
				// 			else filterLevel = Object.entries(this.options.PCILevel).filter(([key, level]) => {	
				// 				return PCISpec >= level.range[0] && PCISpec < level.range[1]
				// 			});

				// 			this.dataLayer.PCIBlock.overrideStyle(
				// 				event.feature, 
				// 				{ 
				// 					fillOpacity: 0, 
				// 					strokeColor: filterLevel[0][1].color, 
				// 					strokeOpacity: 0.4,
				// 					strokeWeight: 2,
				// 					zIndex: 3 
				// 				});
				// 		} else {
				// 			overlay.setMap(null);
				// 			delete this.overlayLayer[blockId];

				// 			this.$message({
				// 				message: "尚無正射圖",
				// 				type: "error",
				// 			});
				// 		}
				// 		// this.loading = false;
				// 	});
				// });

				// TODO: 右鍵顯示「正射」 (測試-tiff)
				// this.dataLayer.PCIBlock.addListener('rightclick', (event) => {
				// 	// console.log(event.feature);
				// 	// this.loading = true;
				// 	const blockId = event.feature.getProperty("blockId");
				// 	const tenderId = this.options.tenderRoundMap[this.listQuery.tenderRound].tenderId;
				// 	const url = `https://storage.googleapis.com/adm_orthographic/${tenderId}/${blockId}.tif`;

				// 	fromUrl(url).then( async(geoTiffFile) => {
				// 			const imageSpec = await geoTiffFile.getImage(0);
				// 			// console.log(imageSpec);
				// 			const imgSrc = await this.toDataURL(await imageSpec.readRGB({ pool: this.geoTiffPool, enableAlpha: true }), imageSpec.getWidth(), imageSpec.getHeight());
				// 			// console.log(imgSrc);

				// 			let [ west, south, east, north ] = imageSpec.getBoundingBox();
				// 			[ west, south ] = proj4("EPSG:3826","EPSG:4326", [ west, south ] );
				// 			[ east, north ] = proj4("EPSG:3826","EPSG:4326", [ east, north ] );

				// 			console.log(west, south, east, north);
				// 			const imageBounds = { west, south, east, north };
				// 			new google.maps.GroundOverlay( imgSrc, imageBounds, { map: this.map } );
				// 			// this.loading = false;
				// 		}).catch(err => console.log(err));
				// });

				this.dataLayer.case = new google.maps.Data();
				this.dataLayer.case.setStyle(feature => { 
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
							strokeColor: '#BDBDBD',
							strokeWeight: 1,
							strokeOpacity: 1,
							fillColor: color,
							fillOpacity: 1,
							zIndex: 1000 - feature.getProperty("area")
						};
					}
				});

				this.dataLayer.case.addListener('click', (event) => {
					this.showContent(event.feature, event.latLng);
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
			this.getList();
		},
		async getList() {
			this.loading = true;
			this.clearAll();

			// 載入case GeoJSON
			const tenderRound = this.options.tenderRoundMap[this.listQuery.tenderRound];
			const startDate = moment(tenderRound.roundStart).format("YYYY-MM-DD");
			const endDate = moment(tenderRound.roundEnd).format("YYYY-MM-DD");
			this.searchRange = startDate + " - " + endDate;
			
			if(this.caseSwitch) await this.getCaseGeo();
			
			// 載入區塊
			if(!this.blockGeo_bell[this.listQuery.tenderRound] || this.blockGeo_bell[this.listQuery.tenderRound].length == 0) await this.getBlock();
			else this.geoJSON.block = JSON.parse(this.blockGeo_bell[this.listQuery.tenderRound]);
			
			// 獲取PCI
			if (tenderRound.isArchive) {
				getBlockPCIArchive({ 
					tenderId: tenderRound.tenderId,
					surveyId: tenderRound.id,
					zipCode: tenderRound.isMain ? 0 : tenderRound.zipCode
				}).then(async (response) => {
					const summary = response.data.summary[0];
					Object.keys(this.options.PCILevel).forEach(key => {
						const levelText = this.options.PCILevel[key].text;
						this.options.PCILevel[key].total = summary[levelText];
					})

					const list = response.data.list;
					this.geoJSON.block.features.forEach(block => {
						const PCIData = list.filter(l => l.pciId == block.properties.pciId);
						if(PCIData.length > 0) {
							block.properties.PCIValue = PCIData[0].PCI_real;
							block.properties.updateTime = PCIData[0].updateTime;
						}
					});
					this.dataLayer.PCIBlock.addGeoJson(this.geoJSON.block);

					await this.focusMap();
					this.loading = false;
				}).catch(err => this.loading = false);
			} else {
				getBlockPCI({ 
					tenderId: tenderRound.tenderId,
					zipCode: tenderRound.isMain ? 0 : tenderRound.zipCode
				}).then(async (response) => {
					const summary = response.data.summary[0];
					Object.keys(this.options.PCILevel).forEach(key => {
						const levelText = this.options.PCILevel[key].text;
						this.options.PCILevel[key].total = summary[levelText];
					})

					const list = response.data.list;
					this.geoJSON.block.features.forEach(block => {
						const PCIData = list.filter(l => l.pciId == block.properties.pciId);
						if(PCIData.length > 0) {
							block.properties.PCIValue = PCIData[0].PCI_real;
							block.properties.updateTime = PCIData[0].updateTime;
						}
					});
					this.dataLayer.PCIBlock.addGeoJson(this.geoJSON.block);

					await this.focusMap();
					this.loading = false;
				}).catch(err => this.loading = false);
			}
		},
		async getBlock() {
			const tenderRound = this.options.tenderRoundMap[this.listQuery.tenderRound];
			this.dataLayer.PCIBlock.forEach(feature => this.dataLayer.PCIBlock.remove(feature));

			return new Promise((resolve, reject) => {
				getBlockGeo({ 
					tenderId: tenderRound.tenderId,
					zipCode: tenderRound.isMain ? 0 : tenderRound.zipCode,
					blockType: [1]
				}).then(async (response) => {
					if(response.data.geoJSON.length == 0) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
					} else {
						this.geoJSON.block = JSON.parse(response.data.geoJSON).block_bell;

						this.$store.dispatch('block/setGeoJSON_bell', { 
							tenderRound: this.listQuery.tenderRound, 
							JSONString: JSON.stringify(this.geoJSON.block)
						});
						// this.dataLayer.PCIBlock.addGeoJson(this.geoJSON.block.block_bell);
						// this.loading = false;
						resolve();
					}
				})
			})
		},
		async getCaseGeo() {
			this.loading = true;

			const tenderRound = this.options.tenderRoundMap[this.listQuery.tenderRound];
			const startDate = moment(tenderRound.roundStart).format("YYYY-MM-DD");
			const endDate = moment(tenderRound.roundEnd).format("YYYY-MM-DD");
			this.searchRange = startDate + " - " + endDate;

			return new Promise((resolve, reject) => {
				getRoadCaseGeo({
					surveyId: tenderRound.id,
				}).then(response => {
					if(response.data.geoJSON.length == 0) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
					} else {
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
						this.dataLayer.case.addGeoJson(this.geoJSON.case);

						this.loading = false;
						resolve();
					}
				}).catch(err => this.loading = false);
			})
		},
		async search() {
			this.loading = true;
			await this.focusMap();
			this.loading = false;
		},
		async focusMap() {
			// console.log("focusMap");
			return new Promise(resolve => {
				this.dataLayer.PCIBlock.revertStyle();

				if(!this.listQuery.filterId || this.listQuery.filterId.length == 0) resolve();
				if(this.listQuery.filterType == 1 && this.listQuery.filterId.length != 0 && !Number(this.listQuery.filterId)) {
					this.$message({
						message: "請輸入正確編號",
						type: "error",
					});
					resolve();
				} else {
					const key = this.listQuery.filterType == 1 ? 'pciId' : 'roadName';
					let query = {};
					query[key] = this.listQuery.filterId;
					// let blockSpec;
					// this.dataLayer.PCIBlock.forEach(features =>{ 
					// 	if(feature.getProperty(key) == this.listQuery.filterId) blockSpec = features;
					// });

					let featureList = [];
					this.dataLayer.PCIBlock.forEach(feature =>{ 
						if(feature.getProperty(key) == this.listQuery.filterId) featureList.push(feature);
					});

					if(featureList.length == 0) {
					// if(blockSpec == undefined ) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
						resolve();
					} else {
						this.$router.push({ query: { tenderRound: this.listQuery.tenderRound, ...query } });
						
						const bounds = new google.maps.LatLngBounds();
						for(const feature of featureList) {
							this.dataLayer.PCIBlock.overrideStyle(feature, { strokeColor: "#FF6F00", zIndex: 3 });
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
		switchBlock() {
			if(this.blockSwitch) this.dataLayer.PCIBlock.setMap(this.map);
			else this.dataLayer.PCIBlock.setMap(null);
		},
		async switchCase() {
			let caseDataLayerNum = 0;
			this.dataLayer.case.forEach(() => caseDataLayerNum++);
			if(caseDataLayerNum == 0) await this.getCaseGeo();

			if(this.caseSwitch) this.dataLayer.case.setMap(this.map);
			else this.dataLayer.case.setMap(null);
		},
		async toDataURL(geoTiffDataRGB, width, height) {
			// console.log(typeof geoTiffDataRGB);
			// console.log(geoTiffDataRGB);
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d', { willReadFrequently: true });
			const imageData = ctx.getImageData(0, 0, width, height);
			// convert GeoTiff's RGBA values to ImageData's RGBA values
			for (let i = 0; i < height; i++) {
				for (let j = 0; j < width; j++) {
					const srcIdx = 4 * i * width + 4 * j;
					const idx = 4 * i * width + 4 * j;
					imageData.data[idx] = geoTiffDataRGB[srcIdx];
					imageData.data[idx + 1] = geoTiffDataRGB[srcIdx + 1];
					imageData.data[idx + 2] = geoTiffDataRGB[srcIdx + 2];
					imageData.data[idx + 3] = geoTiffDataRGB[srcIdx + 3];
				}
			}
			ctx.putImageData(imageData, 0, 0);
			return new Promise((resolve, reject) => {
				resolve(canvas.toDataURL('image/png'));
			});
		},
		async showContent(feature, position) {
			this.blockInfo = {
				id: 0,
				feature: null
			}
			this.pciId = 0;
			let contentText = `<div style="width: 400px;">`;
			for(const key in this.headers.content) {
				// console.log(key);
				// console.log(feature.getProperty(key));
				this.imgUrls = [];
				if(feature.getProperty(key)) {
					let prop = feature.getProperty(key);
					if(["updateTime"].includes(key)) prop = this.formatTime(prop);

					contentText += `<div class="el-row" style="margin-bottom: 4px">`;
					contentText += `<div class="el-col el-col-8" style="padding-left: 5px; font-size: 18px; line-height: 18px;">${this.headers.content[key]}</div>`;
					contentText += `<div class="el-col el-col-16" style="font-size: 18px; line-height: 18px;">${prop}</div>`;
					contentText += `</div>`;
				}
			}

			if(feature.getProperty("caseId")) {
				this.imgUrls = [ `https://img.bellsgis.com/images/online_pic/${feature.getProperty("caseId")}.jpg` ];
				contentText += `<img src="https://img.bellsgis.com/images/online_pic/${feature.getProperty("caseId")}.jpg" class="img" onerror="this.className='img hide-img'; document.getElementById('info-scrn-full-btn').style.opacity='0'">`;
				contentText += `<button type="button" id="info-scrn-full-btn" class="info-btn scrn-full el-button el-button--default" style="height: 30px; width: 30px; opacity: 1"><i class="el-icon-full-screen btn-text"></i></button>`;
				contentText += `</div>`;
			} else if(feature.getProperty("blockId")) {
				this.blockInfo = {
					id: feature.getProperty("blockId"),
					feature
				}
				this.pciId = feature.getProperty("pciId");
				const orthoPath = this.options.tenderRoundMap[this.listQuery.tenderRound].orthoPath;
				const url = `${orthoPath.replace("_jpg", "")}${this.blockInfo.id}.tif`;
				// fromUrl(url).then( async(geoTiffFile) => {
				// 	const imageSpec = await geoTiffFile.getImage(0);
				// 	// console.log(imageSpec);
				// 	const imgSrc = await this.toDataURL(await imageSpec.readRGB({ pool: this.geoTiffPool, enableAlpha: true }), imageSpec.getWidth(), imageSpec.getHeight());
				// 	this.imgUrls = [ imgSrc ];
				// 	this.$el.querySelector("#map #info-btn").style.opacity = "1";

				// 	// contentText += `<img src="${imgSrc}" class="img" onerror="this.className='img hide-img'">`;
				// 	// contentText += `<button type="button" id="info-scrn-full-btn" class="info-btn scrn-full el-button el-button--default" style="height: 30px; width: 30px;"><i class="el-icon-full-screen btn-text"></i></button></img>`;
				// 	// contentText += `</div>`;
				// }).catch(err => {
				// 	console.log(err);
				// 	this.$el.querySelector("#map #info-btn").style.opacity = "0";
				// });
				
				contentText += `<div id="info-btn" class="info-btn-group">`;
				contentText += `<button type="button" id="case-list-btn" class="info-btn scrn-full el-button el-button--default" style="right: 100px; height: 30px; width: 30px; border-color: #409EFF"><i class="el-icon-tickets btn-text" style="color: #409EFF"></i></button>`;
				contentText += `<button type="button" id="info-scrn-full-btn" class="info-btn scrn-full el-button el-button--default" style="right: 65px; height: 30px; width: 30px; border-color: #909399"><i class="el-icon-full-screen btn-text" style="color: #909399; opacity: 0.5"></i></button>`;
				contentText += `<a href="${url}" target="_blank"><button type="button" id="info-download-btn" class="info-btn scrn-full el-button el-button--default" style="height: 30px; width: 30px; border-color: #909399"><i class="el-icon-download btn-text" style="color: #909399; opacity: 0.5"></i></button></a>`;
				contentText += `</div>`;
			}

			// console.log(contentText);
			this.infoWindow.setContent(contentText);
			this.infoWindow.setOptions({ pixelOffset: new google.maps.Size(0, -10) });
			this.infoWindow.setPosition(position);

			this.infoWindow.open(this.map);
		},
		clearOverlay() {
			this.dataLayer.PCIBlock.revertStyle();

			for(const blockId in this.overlayLayer) {
				this.overlayLayer[blockId].setMap(null);
				this.$delete(this.overlayLayer, blockId);
			}

			this.hasClearOverlay = false;
		},
		clearAll() {
			this.infoWindow.close();
			for(const type of [ "PCIBlock", "case" ]) this.dataLayer[type].forEach(feature => this.dataLayer[type].remove(feature));
			this.clearOverlay();
		},
		formatter(row, column) {
			if (!['caseId'].includes(column.property) && Number(row[column.property])) return row[column.property].toLocaleString();
			else return row[column.property] || "-";
		},
		formatTime(time) {
			return moment(time).local().format("YYYY-MM-DD HH:mm");
		}
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.PCI-map
	position: relative
	height: 100%
	width: 100%
	.header-bar
		position: absolute
		top: 0
		z-index: 1
		padding-left: 10px
		.map-title
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
		// background-color: rgba(white, 0.7)
		z-index: 1
		&.left
			top: 180px
			left: 15px
		&.right
			top: 140px
			right: 20px
		.collapse-label
			width: 100%
			.el-collapse-item__header
				padding: 5px
				&.is-active
					transition: 0.5s
			.el-collapse-item__content
				height: 100%
				padding-bottom: 0
		.el-card__body
			padding: 2px
			.info-title
				text-align: center
				margin-bottom: 0
				line-height: 24px
			.color-box
				line-height: 30px
				*
					color: #ECEFF1
					text-shadow: 0px 0px 1px rgba(#263238, 0.6)
				div:last-child
					text-align: right
					padding-right: 5px
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