<template>
	<div class="case-inspection-route" v-loading="loading">
		<div id="map" ref="map" />
		<div class="header-bar">
			<h2 class="case-title">巡查路線</h2>
			<div class="filter-container">
				<span class="filter-item" style="display: inline-flex">
					<el-button :type="showBlockFilter ? 'primary' : 'info'" @click="showBlockFilter = !showBlockFilter">區塊過濾</el-button>
					<el-card v-if="showBlockFilter" :body-style="{ padding: '0 5px', backgroundColor: 'rgba(255, 255, 255, 0.5)' }">
						<div class="filter-item">
							<div class="select-district el-input el-input--medium el-input-group el-input-group--prepend">
								<div class="el-input-group__prepend">
									<span>行政區</span>
								</div>
								<el-select class="district-select" v-model="listQuery.zipCode">
									<el-option v-for="zip in options.districtOrder.filter(zip => zip != 1003)" :key="zip" :label="options.districtMap[zip].district" :value="Number(zip)" />
								</el-select>
							</div>
						</div>
						<div class="filter-item" style="margin-left: 12px">
							<el-tooltip effect="dark" content="填0為不限制" placement="bottom-end">
								<el-input
									v-model.number="listQuery.width[0]"
									type="number"
									:min="0"
									placeholder="公尺"
									style="width: 160px"
									@input="() => { 
										if (listQuery.width[0] < 0) listQuery.width[0] = 0; 
										if (listQuery.width[1] != 0 && listQuery.width[0] >= listQuery.width[1]) listQuery.width[1] = listQuery.width[0];
									}"
								>
									<el-select slot="prepend" v-model="listQuery.widthType" popper-class="type-select">
										<el-option v-for="(name, type) in options.widthTypeMap" :key="type" :label="name" :value="Number(type)" />
									</el-select>
								</el-input>
							</el-tooltip>

							<span style="margin: 0 12px"> - </span>

							<el-tooltip effect="dark" content="填0為不限制" placement="bottom-end">
								<el-input
									v-model.number="listQuery.width[1]"
									type="number"
									:min="0"
									placeholder="公尺"
									style="width: 160px"
									@input="() => {
										if (listQuery.width[1] < 0) listQuery.width[1] = 0; 
										if (listQuery.width[1] != 0 && listQuery.width[0] >= listQuery.width[1]) listQuery.width[1] = listQuery.width[0]; 
									}"
								>
									<el-select slot="prepend" v-model="listQuery.widthType" popper-class="type-select">
										<el-option v-for="(name, type) in options.widthTypeMap" :key="type" :label="name" :value="Number(type)" />
									</el-select>
								</el-input>
							</el-tooltip>
						</div>
						<el-button-group>
							<el-button type="primary" size="small" @click="blockFilter()">確認</el-button>
							<el-button type="info" size="small" @click="showBlockFilter = false">取消</el-button>
						</el-button-group>
					</el-card>
				</span>
				<br>
				<div class="filter-item">
					<div class="select-district el-input el-input--medium el-input-group el-input-group--prepend">
						<div class="el-input-group__prepend">
							<span>行政區</span>
						</div>
						<el-select class="district-select" v-model="listQuery.inspectRoundZipCode">
							<el-option v-for="zip in options.districtOrder.filter(zip => zip != 1001)" :key="zip" :label="options.districtMap[zip].district" :value="Number(zip)" />
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
				<el-button class="filter-item" type="success" @click="getList()">載入</el-button>
				<el-upload :class="[ 'filter-item', 'upload-csv', { 'is-ready' : csvFileList.length > 0 }]" ref="uploadFile" action accept=".csv" :multiple="false" :limit="1" :auto-upload="false" :file-list="csvFileList" :on-change="readCSV" :on-remove="handleRemove">
					<el-button type="info">上傳CSV</el-button>
				</el-upload>
				<el-button class="filter-item" type="text" @click="showDemo = true">CSV範例</el-button>
				<br>
				<div class="filter-item">
					<el-input v-model="listQuery.filterId" placeholder="請輸入">
						<span slot="prepend">道路名稱</span>
					</el-input>
				</div>
				<el-button class="filter-item" type="primary" size="small" icon="el-icon-search" @click="search()">搜尋</el-button>
			</div>
		</div>

		<el-card v-if="routeList.length > 0" class="info-box right">
			<el-button-group style="width: 100%; margin-bottom: 5px;">
				<el-button type="success" style="width: 50%" :disabled="listQuery.inspectRound == 0" @click="uploadRoute()">上傳路線</el-button>
				<el-button type="info" style="width: 50%" @click="handleDownload()">下載KML</el-button>
			</el-button-group>
			<el-table 
				empty-text="目前沒有資料" 
				:data="routeList"
				size="mini"
				fit 
				:header-cell-style="{'background-color': '#F2F6FC'}"
				:cell-class-name="cellClassName"
				max-height="550px"
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
					:width="['id', 'dist'].includes(key) ? 70 : null"
					align="center"
				/>
			</el-table>
		</el-card>

		<el-dialog :visible.sync="showDemo" width="1110px" center>
			<div>1標週期一.csv (<el-link href="/demo/1標週期一.csv" target="_blank">下載<i class="el-icon-download" /></el-link>)</div>
			<br>
			<iframe width="100%" height="600" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vT4pCyT7h1wL1YL_VyH076qo5jg0vC3nQcI-nF4zbZ52XO5rsn7DjlhJvFaN_R7rX_mMciiOdCIGNyS/pubhtml?gid=172832862&single=true&widget=false&headers=false&chrome=false" />
		</el-dialog>
	</div>
</template>

<script>
import { Loader } from "@googlemaps/js-api-loader";
import jschardet from "jschardet";
import iconv from "iconv-lite";
import { json2xml } from '../../utils/json2xml';
import { getInspectionRoute, setInspectionRoute } from "@/api/inspection"
import { getDistMap, getBlockNcoGeo } from "@/api/type";

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
	name: "caseInspectionRoute",
	components: { },
	data() {
		return {
			loading: false,
			isUpload: false,
			showBlockFilter: false,
			showDemo: false,
			screenWidth: window.innerWidth,
			// map: null,
			// dataLayer: {},
			infoWindow: null,
			// geoJSON: {},
			csvFileList: [],
			routeList: [],
			blockList: [],
			geoJSONFilter: {},
			searchRange: "",
			listQuery: {
				zipCode: 1001,
				widthType: 1,
				width: [ 0, 0 ],
				inspectRound: 1,
				inspectRoundZipCode: 100
			},
			headers: {
				id: "序號",
				roadName: "路名",
				dist: "行政區"
			},
			options: { 
				districtMap: { },
				districtOrder: [],
				widthTypeMap: {
					1: "計畫路寬",
					2: "實際路寬",
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
				}
			}
		};
	},
	computed: { },
	watch: { },
	created() {
		this.dataLayer = {  ncoBlock: {} };
		this.geoJSON = {};
	},
	async mounted() {
		this.loading = true;
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
				Object.keys(response.data.districtMap).filter(key => !['1000', '1002'].includes(key) && key <= 1003).forEach(key => {
					this.$set(this.options.districtMap, key, response.data.districtMap[key]);
					this.options.districtOrder.push(key);
				})

				this.options.districtOrder = [ 1001, ...this.options.districtOrder.filter(key => key != 1001) ];
				this.blockFilter();
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
				this.dataLayer.ncoBlock = new google.maps.Data({ map: this.map });
				this.dataLayer.ncoBlock.setStyle({ 
					strokeColor: '#FFF',
					strokeWeight: 1,
					strokeOpacity: 1,
					fillColor: '#2196F3',
					fillOpacity: 0.3,
					zIndex: 1
				});

				this.dataLayer.ncoBlock.addListener('mouseover', (event) => { 
					const description = `${event.feature.getProperty("id")} - ${event.feature.getProperty("roadName")}`;
					this.showCaseContent(description, event.latLng);
				});
				this.dataLayer.ncoBlock.addListener('mouseout', (event) => { this.infoWindow.close() });

				this.dataLayer.ncoBlock.addListener('click', (event) => { 
					// console.log(event.feature);
					const blockFilter = this.blockList.filter(block => block.id == event.feature.getProperty("id"));
					if (blockFilter.length > 0) {
						this.blockList = this.blockList.filter(block => block.id != event.feature.getProperty("id"));
					} else {
						event.feature.toGeoJson((json) => {
							this.blockList.push({
								id: event.feature.getProperty("id"),
								roadName: event.feature.getProperty("roadName"),
								zipCode: event.feature.getProperty("zipCode"),
								geometry: json.geometry
							});	
						});
					}

					this.$nextTick(() => {
						this.revertStyle();

						this.routeList = this.blockList.reduce((acc, curr) => {
							if(acc.length == 0 || !acc.map(route => route.roadName).includes(curr.roadName)) {
								acc.push({
									id: acc.length,
									roadName: curr.roadName,
									dist: this.options.districtMap[curr.zipCode].district,
									isMatch: true
								})
							}
							return acc
						}, []);
					});
				});
			})
		},
		async blockFilter() {
			this.loading = true;
			this.handleRemove(); 
			this.blockList = [];

			this.dataLayer.mask.setStyle(feature => {
				// console.log(feature);
				const condition = [1000].includes(this.listQuery.zipCode);

				return {
					strokeColor: "#000000",
					strokeWeight: 0,
					strokeOpacity: 1,
					fillColor: "#000000",
					fillOpacity: condition ? 0 : 0.7,
					zIndex: 0
				}
			});
			
			this.dataLayer.district.setStyle(feature => {
				// console.log(feature);
				const condition = [999, 1000, 1001, 1003].includes(this.listQuery.zipCode) || this.options.districtMap[this.listQuery.zipCode].district.includes(feature.getProperty("TOWNNAME"));

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
			const boundary = JSON.parse(this.options.districtMap[this.listQuery.zipCode].boundary);
			boundary.coordinates.flat().forEach(position => bounds.extend({ lat: position[1], lng: position[0] }));
			this.map.fitBounds(bounds);
			await this.getBlock();
		},
		cellClassName({ row, column, _ }) { 
			return ['roadName'].includes(column.property) && !row.isMatch ? 'cell-red' : '';
		},
		getList() {
			this.loading = true;
			this.blockList = [];
			this.routeList = [];
			this.revertStyle();

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
					this.routeList = response.data.routeList;
					this.blockList.forEach(block => block.geometry = JSON.parse(block.geometry));
					this.routeList.forEach(route => {
						route.dist = this.options.districtMap[route.zipCode].district;
						route.isMatch = true;
					});
					this.revertStyle(true);
				}
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		getBlock() {
			this.dataLayer.ncoBlock.forEach(feature => this.dataLayer.ncoBlock.remove(feature));

			return new Promise((resolve, reject) => {
				let query = {
					zipCode: [1001, 999].includes(this.listQuery.zipCode) ? 0 : this.listQuery.zipCode
				};

				if (this.listQuery.widthType == 1) query.width = this.listQuery.width;
				else if (this.listQuery.widthType == 2) query.widthReal = this.listQuery.width;

				getBlockNcoGeo(query).then(async (response) => {
					if(response.data.geoJSON.length == 0) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
					} else {
						this.geoJSON.block = JSON.parse(response.data.geoJSON);
						this.dataLayer.ncoBlock.addGeoJson(this.geoJSON.block);

						this.loading = false;
						resolve();
					}
				})
			})
		},
		async readCSV(file, fileList) {
			if(fileList.length > 1) fileList.shift();
			this.csvFileList = JSON.parse(JSON.stringify(fileList));
			this.blockList = [];
			this.routeList = [];

			if(file.raw.type != "text/csv") {
				this.$message({
					type: "warning",
					message: "文件類型不符，請重新上傳正確csv"
				});
				this.handleRemove(); 
			} else {
				// this.loading = true;
				let reader = new FileReader();
				// reader.readAsText(file.raw, "UTF-8");
				reader.readAsArrayBuffer(file.raw);
				reader.onload = async (evt) => {
					// 讀取CSV內容
					// const fileString = evt.target.result;
					const buffer = Buffer.from(evt.target.result);
					const type = jschardet.detect(buffer);
					// console.log(type);
					const fileString = iconv.decode(buffer, type.encoding);

					//轉成array
					this.routeList = this.csvToArray(fileString);

					await this.checkCsv();
				}
			}
		},
		csvToArray(str, delimiter = ",") {
			str = str.replace(/\"(.*)[\r\n|\n](.*)\"/g, "$1$2");
			const headers = str.slice(0, str.indexOf("\n")).split(delimiter).map(header => header.replace(/\r\n/g,'').trim());
			const rows = str.slice(str.indexOf("\n") + 1).split("\n").filter(row => row.length != 0);
			const regex = /("[^"]+"|[^,]+)*,/g;

			const result = rows.map(row => {
				const values = row.split(regex).filter(row => row == undefined || row.length != 0).map(row => {
					if(row == undefined) return row = '';
					else return row.replace(/\r\n|\"/g,'').trim();
				});

				return headers.reduce((object, header, index) => {
					const headerKey = Object.keys(this.headers).filter(key => this.headers[key] == header)[0];
					if(headerKey == 'roadName') {
						const chineseNum = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

						object[headerKey] = values[index].replace(/(.*?)(\d?)(段.*?)/, (_, start, sec, end) => {
							return `${start}${chineseNum[sec] || ""}${end}`;
						});
					} else object[headerKey] = values[index];
					return object
				}, {});
			});	

			result.forEach(row => row.isMatch = false);

			return result;
		},
		async checkCsv() {
			return new Promise(resolve => {
				this.dataLayer.ncoBlock.revertStyle();

				let featureList = [];
				this.routeList.forEach(route => {
					// console.log(route);
					this.dataLayer.ncoBlock.forEach(feature =>{ 
						if(feature.getProperty("roadName") == route.roadName) {
							feature.toGeoJson((json) => {
								this.blockList.push({
									id: feature.getProperty("id"),
									roadName: feature.getProperty("roadName"),
									geometry: json.geometry
								});
							});

							featureList.push(feature);
							route.isMatch = true;
						}
					});
				})

				if(featureList.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
					resolve();
				} else {
					const bounds = new google.maps.LatLngBounds();
					for(const feature of featureList) {
						this.dataLayer.ncoBlock.overrideStyle(feature, { fillColor: "#FF6F00", fillOpacity: 1, zIndex: 3 });
						const paths = feature.getGeometry();
						// console.log(paths);
						paths.forEachLatLng(position => bounds.extend(position));
					}
					this.map.fitBounds(bounds);
					resolve();	
				}
			})
		},
		handleRemove(file, fileList) {
			if(fileList == undefined) this.csvFileList = [];
			else this.csvFileList = JSON.parse(JSON.stringify(fileList));
			this.routeList = [];
			this.$refs.uploadFile.clearFiles();
			this.isUpload = false;
			this.dataLayer.ncoBlock.revertStyle();
		},
		handleMouseEnter(row, column, cell, event) {
			// console.log(row);

			if(row.isMatch) {
				let featureList = [];
				this.dataLayer.ncoBlock.forEach(feature =>{ 
					if(feature.getProperty("roadName") == row.roadName) featureList.push(feature);
				});
				const bounds = new google.maps.LatLngBounds();
				for(const feature of featureList) {
					this.dataLayer.ncoBlock.overrideStyle(feature, { strokeColor: "#2F4F4F", zIndex: 3 });
					const paths = feature.getGeometry();
					// console.log(paths);
					paths.forEachLatLng(position => bounds.extend(position));
				}
				this.map.fitBounds(bounds);
			} else {
				this.$message({
					message: `查無「${row.roadName}」`,
					type: "error",
				});
			}
		},
		handleMouseLeave(row, column, cell, event) {
			// console.log(row.blockId);
			this.revertStyle();
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
									"color": "ffff6f00",
									"fill": "1"
							}
						},
						"Folder": {
							"styleUrl": "#style1",
							"Placemark": this.blockList.map(block => ({
								"name": block.roadName,
								"Polygon": {
									"outerBoundaryIs": {
										"LinearRing": {
											"coordinates": block.geometry.coordinates.flat(2).map(point => point.join(",")).join(" ")
										}
									}
								}
							}))
						}
					}
				}
			};

			const filenameOri = this.csvFileList.length > 0 
				? this.csvFileList[0].name.split(".")[0] 
				: `${this.options.districtMap[this.listQuery.inspectRoundZipCode].district}_${this.options.inspectRound[this.listQuery.inspectRound]}`;
			const filename = `${filenameOri}.kml`; 
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
		revertStyle(focus = false) {
			this.dataLayer.ncoBlock.revertStyle();

			let featureList = [];
			this.dataLayer.ncoBlock.forEach(feature =>{ 
				if(this.blockList.map(l => l.id).includes(feature.getProperty("id"))) featureList.push(feature);
			});

			const bounds = new google.maps.LatLngBounds();
			for(const feature of featureList) {
				this.dataLayer.ncoBlock.overrideStyle(feature, { fillColor: "#FF6F00", fillOpacity: 1, zIndex: 3 });
				const paths = feature.getGeometry();
				// console.log(paths);
				paths.forEachLatLng(position => bounds.extend(position));
			}

			if(focus) this.map.fitBounds(bounds);
		},
		uploadRoute() {
			this.$confirm(`確定上傳「${this.options.districtMap[this.listQuery.inspectRoundZipCode].district}」 ${this.options.inspectRound[this.listQuery.inspectRound]} 巡查路線?`, "確認", {
				showClose: false,
			}).then(() => {
				this.loading = true;
				this.isUpload = true;
				const uploadBlockList = this.blockList.map(block => ({ blockId: Number(block.id), roadName: block.roadName }));
				// console.log(uploadBlockList);

				setInspectionRoute({
					zipCode: this.listQuery.inspectRoundZipCode,
					inspectRound: this.listQuery.inspectRound,
					blockList: uploadBlockList
				}).then(response => {
					if ( response.statusCode == 20000 ) {
						this.$message({
							message: "上傳成功",
							type: "success",
						});
					} 
					this.handleRemove();
					// this.loading = false;
					this.getList();
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
				this.revertStyle();

				if(!this.listQuery.filterId || this.listQuery.filterId.length == 0) resolve();
				else {
					let featureList = [];
					this.dataLayer.ncoBlock.forEach(feature =>{ 
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
							this.dataLayer.ncoBlock.overrideStyle(feature, { strokeColor: "#2F4F4F", zIndex: 3 });
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
.case-inspection-route
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
		.select-district
			.el-select .el-input__inner
				border-top-left-radius: 0
				border-bottom-left-radius: 0
				padding-left: 10px
				text-align: left
		.filter-container 
			.upload-csv
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
			.el-table
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