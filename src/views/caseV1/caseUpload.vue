<template>
	<div class="case-upload" v-loading="loading">
		<div id="map" ref="map" />
		<div class="header-bar">
			<h2 class="case-title">缺失上傳</h2>
			<div class="filter-container">
				<div class="filter-item">
					<div class="select-contract el-input el-input--medium el-input-group el-input-group--prepend">
							<div class="el-input-group__prepend">
								<span>合約</span>
							</div>
						<el-select v-model.number="listQuery.tenderId" class="tender-select" popper-class="type-select tender" @input="changeTender()">
							<el-option v-for="(obj, id) in options.tenderMap" :key="id" :label="obj.tenderName" :value="Number(id)" />
						</el-select>
					</div>
				</div>
				<br>
				<div class="filter-item">
					<el-input v-model="listQuery.filterId" placeholder="請輸入">
						<span slot="prepend">道路名稱</span>
					</el-input>
				</div>
				<el-button class="filter-item" type="primary" size="small" icon="el-icon-search" @click="search()">搜尋</el-button>
				<el-upload :class="[ 'filter-item', 'upload-kml', { 'is-ready' : kmlFileList.length > 0 }]" ref="uploadFile" action accept=".kml" :multiple="false" :limit="1" :auto-upload="false" :file-list="kmlFileList" :on-change="readKML" :on-remove="handleRemove">
					<!-- <i class="el-icon-upload" />
					<div class="el-upload__text">將CSV拖曳至此處，或<em>點此上傳</em></div> -->
					<el-button type="info">載入KML</el-button>
				</el-upload>
				<el-tag v-if="kmlFileList.length > 0" type="info"> {{ caseList.length - caseErrListLen }} / {{ caseList.length }}</el-tag>
			</div>
			<span v-if="caseInfo.length != 0" style="background-color: #F2F6FC; margin: 0 5px; opacity: 0.8;">查詢期間：{{ searchRange }}</span>
		</div>

		<el-card v-if="caseList.length > 0" class="info-box right">
			<el-button v-if="allCorrect" type="success" style="width: 100%" :disabled="isUpload" @click="uploadCase()">全部上傳({{ caseList.length }})</el-button>
			<el-button-group v-else style="width: 100%; margin-bottom: 5px;">
				<el-button style="width: 50%" @click="handleDownload()">下載KML({{ caseErrListLen }})</el-button>
				<el-button type="success" style="width: 50%" :disabled="isUpload" @click="uploadCase()">部分上傳({{ caseList.length - caseErrListLen }})</el-button>
			</el-button-group>
			<!-- <div class="color-box" v-for="(color, index) in options.caseColorMap" :key="`color_${index}`"  :style="`background-color: ${color.color}; width: 100%; height: 30px;`">{{ color.name.join("、") }}</div> -->
			<el-collapse v-if="!allCorrect" v-model="listQuery.labelCur" accordion>
				<el-collapse-item v-for="caseListSpec in caseErrList.filter(caseList => caseList.list.length != 0)" :key="caseListSpec.key" class="case-label" :name="caseListSpec.key">
					<span slot="title">{{ caseListSpec.name }} - {{ caseListSpec.list.length }}</span>
					<el-table 
						empty-text="目前沒有資料" 
						:data="caseListSpec.list"
						size="mini"
						fit 
						:header-cell-style="{'background-color': '#F2F6FC'}"
						:cell-class-name="cellClassName"
						max-height="350px"
						style="width: 100%;"
						@cell-mouse-enter="handleMouseEnter"
						@cell-mouse-leave="handleMouseLeave"
					>
						<el-table-column 
							v-for="(value, key) in headers" 
							:key="key" 
							:prop="key" 
							:label="value"
							:formatter="(row, column, cellValue) => (cellValue != undefined ? cellValue : '-')"
							align="center"
							:width="['id', 'caseLevel', 'duplicateId'].includes(key) ? 55 : null"
						/>
					</el-table>
				</el-collapse-item>
			</el-collapse>
		</el-card>

		<!-- <el-card class="info-box left">
			<el-row :class="[ 'color-box', { 'active' : selectCase[info.caseName].switch } ]" v-for="(info, index) in caseInfo" :key="`caseInfo_${info.caseName}_${index}`"  :style="`background-color: ${info.color}; width: 100%; margin-bottom: 0px`">
				<el-col :span="10" style="padding: 0 5px">{{ String(info.caseName) || " - " }}</el-col>
				<el-col :span="5">
					<span v-if="selectCase[info.caseName].level == 0">{{ info.total }}</span>
					<span v-else>{{ 
						info.level.filter(l => l.caseLevel == options.levelMap[selectCase[info.caseName].level]).length > 0 ?
						info.level.filter(l => l.caseLevel == options.levelMap[selectCase[info.caseName].level])[0].total : 0
					}}</span>
				</el-col>
			</el-row>
		</el-card> -->
	</div>
</template>

<script>
import { mapGetters } from "vuex";
import { Loader } from "@googlemaps/js-api-loader";
import { parseXml, xml2json } from '../../utils/xml2json';
import { json2xml } from '../../utils/json2xml';
import { uploadRoadCase } from '@/api/roadV1';
import { getDistMap, getTenderMap, getBlockGeo } from "@/api/type";

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
	name: "caseUpload",
	components: { },
	data() {
		return {
			loading: false,
			isUpload: false,
			screenWidth: window.innerWidth,
			// map: null,
			// dataLayer: {},
			infoWindow: null,
			// geoJSON: {},
			kmlFileList: [],
			caseInfo: [],
			caseList: [],
			geoJSONFilter: {},
			searchRange: "",
			listQuery: {
				tenderId: 100,
				filterId: null,
				labelCur: ""
			},
			headers: {
				id: "序號",
				// caseId: "缺失編號",
				caseName: "類型",
				caseLevel: "程度",
				geoType: "幾何類型",
				duplicateId: "重複"
				// roadName: "道路名稱",
				// length: "長度(m)",
				// area: "面積(㎡)",
				// depth: "深度(cm)"
			},
			options: { 
				tenderMap: {},
				caseColorMap: [
					{
						index: 0,
						name: ["龜裂"],
						engName: ["CRD"],
						color: "#B71C1C"
					},
					{
						index: 1,
						name: ["裂縫", "縱橫裂縫", "塊狀裂縫"],
						engName: ["CAK", "CRK"],
						color: "#009688"
					},
					{
						index: 2,
						name: ["坑洞", "人孔高差", "薄層剝離"],
						engName: ["HLE"],
						color: "#FF9800"
					},
					{
						index: 3,
						name: ["車轍"],
						engName: ["RUT"],
						color: "#00BCD4"
					},
					{
						index: 4,
						name: ["補綻", "管線回填"],
						engName: ["CLT"],
						color: "#673AB7"
					},
					{
						index: 5,
						name: ["隆起與凹陷"],
						engName: ["BAD"],
						color: "#8BC34A"
					},
					{	
						index: 6,
						name: ["其他"],
						engName: [],
						color: "#607D8B"
					}
				],
				caseTypeMap: {
					"CRD": "龜裂",
					"CAK": "縱橫裂縫",
					"CRK": "塊狀裂縫",
					"HLE": "坑洞及人孔高差及薄層剝離",
					"RUT": "車轍",
					"CLT": "補綻及管線回填",
					"PUH": "推擠",
					"BAD": "隆起與凹陷",
					"OIL": "冒油",
					"WAP": "波浪狀鋪面",
					"LSS": "車道與路肩分離",
					"SLC": "滑溜裂縫",
					"AGS": "骨材剝落",
					"HLA": "坑洞",
					"HLB": "人孔高差",
					"HLC": "薄層剝離"
				},
				caseLevelMap: {
					"H": "重",
					"M": "中",
					"L": "輕"
				},
				districtMap: {}
			}
		};
	},
	computed: {
		...mapGetters(["blockGeo_bell"]),
		allCorrect() {
			const listFilter = this.caseErrList.filter(listSpec => listSpec.list.length > 0);
			return listFilter.length == 0
		},
		caseErrList() {
			// 自相交
			let errPolygonList =this.caseList.filter(caseSpec => caseSpec.selfIntersection);
			let caseFilter = this.caseList.filter(caseSpec => !caseSpec.selfIntersection);

			// 重複
			let duplicateList = {};
			for(const geoType of ['LineString', 'Polygon']) {
				const caseTypeFilter = caseFilter.filter(caseSpec => caseSpec.geoType == geoType);
				caseTypeFilter.forEach(caseSpec1 => {
					// console.log("caseSpec1: ", caseSpec1.id);
					const duplicateIdList = Object.values(duplicateList).flat().map(obj => obj.id);
					// console.log("duplicateIdList: ", duplicateIdList);
					const duplicateSpecList = caseTypeFilter.filter(caseSpec2 => {
						if(caseSpec1.id == caseSpec2.id || duplicateIdList.includes(caseSpec1.id)) return false;
						else return (caseSpec1.coordinates.length == caseSpec2.coordinates.length) 
							&& caseSpec1.coordinates.every((p, i) => caseSpec2.coordinates[i].lat == p.lat && caseSpec2.coordinates[i].lng == p.lng)
					})
					// console.log("duplicateSpecList: ", duplicateSpecList);
					if(duplicateSpecList.length > 0) duplicateList[caseSpec1.id] = duplicateSpecList.map(caseSpec => ({...caseSpec, duplicateId: caseSpec1.id}));
				});
				// console.log("duplicateList: ", duplicateList);
			}

			let errIdList = Object.values(duplicateList).flat().map(obj => obj.id);
			caseFilter = caseFilter.filter(caseSpec => !errIdList.includes(caseSpec.id));
			
			// ----
			// 欄位缺漏
			const emptyFiledList = caseFilter.filter(caseSpec => {
				const emptyColList = Object.keys(this.headers).filter(header => {
					return !['id', 'duplicateId'].includes(header) && (caseSpec[header] == null || caseSpec[header].length == 0)
				});
				return emptyColList.length > 0
			});

			errIdList = emptyFiledList.map(obj => obj.id);
			caseFilter = this.caseList.filter(caseSpec => !errIdList.includes(caseSpec.id));

			// ---
			// 內容錯植
			const errContentList = caseFilter.filter(caseSpec => (
				!Object.values(this.options.caseTypeMap).includes(caseSpec.caseName) || !Object.values(this.options.caseLevelMap).includes(caseSpec.caseLevel)
			));

			errIdList = errContentList.map(obj => obj.id);
			caseFilter = this.caseList.filter(caseSpec => !errIdList.includes(caseSpec.id));

			return [
				{
					key: "errPolygon",
					name: "自相交",
					list: Object.values(errPolygonList).flat(),
					errPolygonList
				},
				{
					key: "duplicateCase",
					name: "重複",
					list: Object.values(duplicateList).flat(),
					duplicateList
				},
				{
					key: "emptyField",
					name: "欄位缺漏",
					list: emptyFiledList
				},
				{
					key: "errContent",
					name: "內容錯植",
					list: errContentList
				},
				{
					key: "errGeoType",
					name: "幾何格式錯誤",
					list: this.caseList.filter(caseSpec => {
						return (
								(caseSpec.caseName != null && caseSpec.caseName.length != 0 && Object.values(this.options.caseTypeMap).includes(caseSpec.caseName)) 
								&& (caseSpec.caseLevel != null && caseSpec.caseLevel.length != 0 && Object.values(this.options.caseLevelMap).includes(caseSpec.caseLevel))
							) && (
								(caseSpec.caseName == '縱橫裂縫' && caseSpec.geoType != 'LineString')
								|| (caseSpec.caseName != '縱橫裂縫' && caseSpec.geoType != 'Polygon')
							)
					})
				}
			]
		},
		caseErrListLen() {
			return this.caseErrList.reduce((acc, cur) => acc+=cur.list.length, 0);
		}
	},
	watch: { },
	created() {
		this.dataLayer = {  PCIBlock: {} };
		this.geoJSON = {};
		this.polygons = [];
		this.markers = [];
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

			await getDistMap().then(response => this.options.districtMap = response.data.districtMap);
			getTenderMap().then(response => {
			this.options.tenderMap = response.data.tenderMap;
			if(Object.keys(this.options.tenderMap).length > 0) {
				if(!Object.keys(this.options.tenderMap).includes(String(this.listQuery.tenderId))) this.listQuery.tenderId = Object.keys(this.options.tenderMap)[0];
				this.changeTender();
			}
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

				// jsts
				this.geometryFactory = new jsts.geom.GeometryFactory();
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
				this.dataLayer.PCIBlock = new google.maps.Data({ map: this.map });
				this.dataLayer.PCIBlock.setStyle({ 
					strokeColor: '#FFF',
					strokeWeight: 1,
					strokeOpacity: 1,
					fillColor: '#2196F3',
					fillOpacity: 0.1,
					zIndex: 1
				});

				this.map.data.setStyle(feature => { 
					// console.log(feature.getProperty("caseName"));
					let color = this.options.caseColorMap.filter(color => color.name == '其他')[0].color;
					if(feature.getProperty("caseName")) {
						const colorFilter = this.options.caseColorMap.filter(color => {
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
			})
		},
		async changeTender() {
			this.handleRemove(); 
			const zipCode = this.options.tenderMap[this.listQuery.tenderId].zipCode;

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
			await this.getBlock();
		},
		cellClassName({ row, column, _ }) { 
			return !['id', 'duplicateId'].includes(column.property) && (row[column.property] == null || row[column.property].length == 0) ? 'cell-red' : '';
		},
		getBlock() {
			this.dataLayer.PCIBlock.forEach(feature => this.dataLayer.PCIBlock.remove(feature));

			return new Promise((resolve, reject) => {
				getBlockGeo({ 
					tenderId: this.listQuery.tenderId,
					zipCode: 0,
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
						this.dataLayer.PCIBlock.addGeoJson(this.geoJSON.block);

						resolve();
					}
				})
			})
		},
		readKML(file, fileList) {
			if(fileList.length > 1) fileList.shift();
			this.kmlFileList = JSON.parse(JSON.stringify(fileList));
			// console.log(file);
			// this.loading = true;
			const reader = new FileReader();
			// reader.readAsText(file.raw, "UTF-8");
			// reader.readAsArrayBuffer(file.raw);
			reader.readAsText(file.raw);
			reader.onload = (evt) => {
				// console.log(evt);
				const fileString = evt.target.result;
				// console.log(fileString);

				// const xml = new DOMParser().parseFromString(fileString, "text/xml");
				// console.log(xml);
				// console.log(parseXml(fileString));
				const json = JSON.parse(xml2json(parseXml(fileString), ''));
				// console.log(json);
				const bounds = new google.maps.LatLngBounds();
				this.caseList = [];

				if(!Array.isArray(json.kml.Document.Folder)) json.kml.Document.Folder = [ json.kml.Document.Folder ];
				for(const [folderId, folder] of json.kml.Document.Folder.entries()) {
					if(!Array.isArray(folder.Placemark)) folder.Placemark = [ folder.Placemark ];
					for(const [placeIndex, caseInfo] of folder.Placemark.entries()) {
						// console.log(caseInfo);
						const isLine = caseInfo.hasOwnProperty("LineString");
						const coordinatesStr = isLine ?  caseInfo.LineString.coordinates : caseInfo.Polygon.outerBoundaryIs.LinearRing.coordinates;
						const path = coordinatesStr.split(" ").map(pointStr => {
							const point = pointStr.split(",");
							bounds.extend({ lat: Number(point[1]), lng: Number(point[0]) })
							return { lat: Number(point[1]), lng: Number(point[0]) };
						});

						// 自相交檢測
						let isSelfIntersection = false;
						if(!isLine) {
							const jstsPolygon = this.createJstsGeometry(path);
							const validator = new jsts.operation.IsSimpleOp(jstsPolygon);
							if (validator.isSimpleLinearGeometry(jstsPolygon)) {}
							const graph = new jsts.geomgraph.GeometryGraph(0, jstsPolygon);
							const cat = new jsts.operation.valid.ConsistentAreaTester(graph);
							isSelfIntersection = !cat.isNodeConsistentArea();
							if(isSelfIntersection) {
								const pt = cat.getInvalidPoint();
								this.markers.push(
									new google.maps.Marker({
										position: { lat: pt.x, lng: pt.y },
										icon: { 
											url: `/assets/icon/icon_redDot.png`,
											scaledSize: new google.maps.Size(6, 6) 
										},
										map: this.map
									})
								);
							}
						}

						const caseName = caseInfo.name != null && this.options.caseTypeMap[caseInfo.name.substring(0,3).toUpperCase()] != undefined ? this.options.caseTypeMap[caseInfo.name.substring(0,3).toUpperCase()] : caseInfo.name;
						const caseLevel = caseInfo.description != null && this.options.caseLevelMap[caseInfo.description.toUpperCase()] != undefined ? this.options.caseLevelMap[caseInfo.description.toUpperCase()] : caseInfo.description;

						this.caseList.push({ 
							id: `${folderId}_${placeIndex}`,
							caseName,
							caseLevel,
							geoType: caseInfo.hasOwnProperty("LineString") ? 'LineString' : caseInfo.hasOwnProperty("Polygon") ? 'Polygon' : '',
							coordinates: path,
							oriJSON: caseInfo,
							selfIntersection: isSelfIntersection
						});

						// console.log(path);
						const caseColorFilter = this.options.caseColorMap.filter(caseColorSpec => {
							const caseNameFilter = caseColorSpec.engName.filter(caseName => caseInfo.name.includes(caseName)); 
							return caseNameFilter.length > 0
						});
						const color = (caseColorFilter.length > 0) ? caseColorFilter[0].color : this.options.caseColorMap.filter(caseColorSpec => caseColorSpec.name.includes('其他'))[0].color;

						if (isLine) {
							const polyline = new google.maps.Polyline({ 
								map: this.map,
								path,
								description: `${folderId}_${placeIndex} - ${caseName}(${caseLevel})`,
								strokeColor: color,
								strokeWeight: 3,
								strokeOpacity: 1,
								fillOpacity: 0,
								zIndex: 5
							});

							polyline.addListener('mouseover', (event) => { this.showCaseContent(polyline.description, event.latLng) });
							polyline.addListener('mouseout', (event) => { this.infoWindow.close() });

							this.polygons.push(polyline);
						} else {
							const polygon = new google.maps.Polygon({ 
								map: this.map,
								path,
								description: `${folderId}_${placeIndex} - ${caseName}(${caseLevel})`,
								strokeColor: color,
								strokeWeight: 1,
								strokeOpacity: 1,
								fillColor: color,
								fillOpacity: 0.8,
								zIndex: 5
							});

							polygon.addListener('mouseover', (event) => { this.showCaseContent(polygon.description, event.latLng) });
							polygon.addListener('mouseout', (event) => { this.infoWindow.close() });

							this.polygons.push(polygon);
						}
					}
				}

				this.map.fitBounds(bounds);
			}
		},
		createJstsGeometry(boundary) {
			// console.log(boundary);
			let coordinates = boundary.map(coord => new jsts.geom.Coordinate(coord.lat, coord.lng));

			if (coordinates.length == 1) return this.geometryFactory.createPoint(coordinates[0]);
			else {
				if(coordinates[0].compareTo(coordinates[coordinates.length-1]) != 0) coordinates.push(coordinates[0]);
				const shell = this.geometryFactory.createLinearRing(coordinates);
				return this.geometryFactory.createPolygon(shell);
			}
		},
		handleRemove(file, fileList) {
			if(fileList == undefined) this.kmlFileList = [];
			else this.kmlFileList = JSON.parse(JSON.stringify(fileList));
			for(const polygon of this.polygons) polygon.setMap(null);
			for(const marker of this.markers) marker.setMap(null);
			this.caseList = [];
			this.polygons = [];
			this.markers = [];
			this.$refs.uploadFile.clearFiles();
			this.isUpload = false;
		},
		handleMouseEnter(row, column, cell, event) {
			// console.log(row);
			const bounds = new google.maps.LatLngBounds();
			row.coordinates.forEach(point => bounds.extend(point));
			this.map.fitBounds(bounds);
			const description = `${row.id} - ${row.caseName}(${row.caseLevel})`;
			this.showCaseContent(description, row.coordinates[0]);

			// this.map.data.revertStyle();
			// this.map.data.forEach(feature => {
			// 	if(feature.getProperty("blockId") == row.blockId) this.map.data.overrideStyle(feature, { fillColor: "#FFF176" });
			// });
		},
		handleMouseLeave(row, column, cell, event) {
			// console.log(row.blockId);
			this.infoWindow.close();
		},
		handleDownload() {
			let json = {
				"kml":{
					"@xmlns": "http://www.opengis.net/kml/2.2",
					"Document": {
						"Style": {
							"@id": "style1",
							"LineStyle": {
									"color": "ffe1e1e1",
									"width": "3"
							},
							"PolyStyle": {
									"color": "ffe1e1e1",
									"fill": "false"
							}
						},
						"Folder": {
							"name": "Layer1",
							"styleUrl": "#style1",
							"Placemark": this.caseErrList.map(caseErrSpec => caseErrSpec.list.map(caseSpec => caseSpec.oriJSON)).flat()
						}
					}
				}
			};

			const filenameOri = this.kmlFileList[0].name.split(".")[0];
			const filename = `${filenameOri}_err.kml`; 
			const file = new File([json2xml(json)], filename, { type: 'text/plain' });
			const link = document.createElement('a');
			const url = URL.createObjectURL(file);
			link.href = url;
			link.download = file.name;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		},
		uploadCase() {
			this.$confirm(`確定上傳缺失 ${this.caseList.length - this.caseErrListLen} 件 至 「${this.options.tenderMap[this.listQuery.tenderId].tenderName}」?`, "確認", {
				showClose: false,
			}).then(() => {
				this.loading = true;
				this.isUpload = true;
				const caseErrIdList = this.caseErrList.map(caseErrSpec => caseErrSpec.list.map(caseSpec => caseSpec.id)).flat();
				const caseListFilter = this.caseList.filter(caseSpec => !caseErrIdList.includes(caseSpec.id));

				const uploadCaseList = caseListFilter.map(caseSpec => {
					const coordinates = caseSpec.coordinates.map(point => ([point.lng, point.lat]));
					// console.log(coordinates);
					const geoJson = {
						"type": caseSpec.geoType == 'LineString' ? 'MultiLineString' : 'MultiPolygon',
						"coordinates": caseSpec.geoType == 'LineString' ? [ coordinates ] : [[ coordinates ]]
					};
					return { caseName: caseSpec.caseName, caseLevel: caseSpec.caseLevel, geoJson }
				});

				// console.log(uploadCaseList);

				uploadRoadCase({
					tenderId: this.listQuery.tenderId,
					caseList: uploadCaseList
				}).then(response => {
					if ( response.statusCode == 20000 ) {
						this.$message({
							message: "上傳成功",
							type: "success",
						});
					} 
					this.handleRemove();
					this.loading = false;
					this.isUpload = false;
				}).catch(err => {
					console.log(err);
					this.loading = false;
					this.isUpload = false;
				})

			}).catch(err => {
				console.log(err);
			});

		},
		async search() {
			this.loading = true;
			await this.focusMap();
			this.loading = false;
		},
		async focusMap() {
			return new Promise(resolve => {
				// console.log("focusMap");
				this.dataLayer.PCIBlock.revertStyle();

				if(!this.listQuery.filterId || this.listQuery.filterId.length == 0) resolve();
				else {
					let featureList = [];
					this.dataLayer.PCIBlock.forEach(feature =>{ 
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
		showCaseContent(description, position) {
			this.infoWindow.setContent(description);
			this.infoWindow.setOptions({ pixelOffset: new google.maps.Size(0, -10)});
			this.infoWindow.setPosition(position);

			this.infoWindow.open(this.map);
		}
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.case-upload
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
		.filter-container 
			.upload-kml
				display: inline-flex
				// flex-direction: row-reverse
				border: 1px solid rgba(#909399, 0.6)
				border-radius: 5px
				&.is-ready > .el-upload.el-upload--text
					display: none
				.el-upload-list__item
					background-color: #fff
					transition: none !important
					margin-top: 0
					.el-upload-list__item-name
						line-height: 35px
						margin: 0 25px 0 10px
					.el-icon-close
						display: block
						top: 50%
						transform: translateY(-50%)
						color: #F56C6C
						font-weight: bold
						&:hover
							color: white
							background-color: #F56C6C
							border-radius: 50%
	.info-box
		position: absolute
		width: 340px
		background-color: rgba(white, 0.7)
		z-index: 1
		&.right
			top: 120px
			right: 15px
		&.left
			top: 200px
			left: 15px
		.el-card__body
			padding: 2px
			max-height: 600px
			overflow-x: hidden
			overflow-y: auto
			.color-box
				line-height: 30px
		.case-label
			width: 100%
			.el-collapse-item__header
				background-color: rgba(#909399, 0.8)
				padding: 4px
				&.is-active
					transition: 0.5s
			.el-collapse-item__content
				height: 100%
				padding: 0
			.el-table
				.el-table__body-wrapper
					&::-webkit-scrollbar 
						width: 6px
						background: rgba(213,215,220,0.3)
						border: none
					&::-webkit-scrollbar-track
						border: none
				th.gutter, colgroup col[name='gutter']
					display: none
					width: 0
				.el-table__body
					width: 100% !important
					.el-table__row
						cursor: pointer
				.cell-red
					background-color: #F56C6C
	#map
		overflow: hidden
		background: none !important
		// position: absolute
		height: calc(100vh - 50px)
		// width: 100vw
		[role="region"] > div:first-child > div:first-child
			z-index: 120 !important
</style>