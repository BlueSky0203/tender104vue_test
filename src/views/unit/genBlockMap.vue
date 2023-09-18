<template>
	<div class="road-unitGen" v-loading="loading">
		<div id="map" ref="map" />
		<div class="header-bar">
			<h2 class="road-title">維護單元產生</h2>
			<div class="filter-container">
				<div class="filter-item">
					<el-input v-model="listQuery[options.codeType[listQuery.codeType].params]" placeholder="請輸入">
						<el-select slot="prepend" v-model="listQuery.codeType" popper-class="type-select">
							<el-option v-for="(value, type) in options.codeType" :key="type" :label="value.name" :value="Number(type)" />
						</el-select>
					</el-input>
				</div>
				<el-button class="filter-item" type="primary" size="small" icon="el-icon-search" @click="getList();">搜尋</el-button>

				<!-- 步驟條 -->
				<div class="filter-item step-box">
					<el-steps :active="stepOrder" simple>
						<el-step icon="el-icon-add-location" @click.native="switchStep(0)">
							<template slot="title">
								<div>{{ geoInfo.roadName || " - " }}</div>
								<div>{{ geoInfo.area.toLocaleString() }} ㎡ </div>
							</template>
						</el-step>
						<el-step icon="el-icon-edit-outline" @click.native="switchStep(1)">
							<template slot="title">
								<div>切分距離</div>
								<div>{{ listQuery.splitLen }} m </div>
							</template>
						</el-step>
						<el-step icon="el-icon-upload" @click.native="switchStep(2)">
							<template slot="title">
								<div>區塊數量</div>
								<div>{{ geoInfo.blocks.length }}</div>
							</template>
						</el-step>
					</el-steps>
				</div>
			</div>
		</div>

		<!-- 資訊欄 -->
		<div class="info-box">
			<el-card v-if="stepOrder == 0 && geoInfo.roadName.length != 0" class="road-info">
				<div slot="header" class="info-title">道路資訊</div>
				<el-row v-for="(text, key) in headersInfo.road" :key="key">
					<el-col :span="8">{{ text }}: </el-col>
					<el-col :span="16">
						<span v-if="key == 'area'">{{ geoInfo[key].toLocaleString() }} ㎡</span>
						<span v-else>{{ geoInfo[key] }}</span>
						<span v-if="splitType == 2 && key == 'roadName'"> (車道{{ geoInfo.laneId }})</span>
					</el-col>
				</el-row>
				<el-row>
					<el-col :offset="18">
						<el-button type="success" size="small" :disabled="geoInfo.points.length == 0" @click="splitLines()">線段</el-button>
					</el-col>
				</el-row>
			</el-card>

			<el-card v-if="stepOrder == 1 && geoInfo.lines.length != 0" class="road-info">
				<div slot="header">
					<div class="info-title">線段資訊</div>
					<div class="info-btn">
						<el-input 
							v-model="listQuery.splitLen"
							type="number"
							:min="0"
							placeholder="公尺"
							@blur="() => { if (listQuery.splitLen < 0) listQuery.splitLen = 0; }"
						>
							<span slot="prepend">切分距離</span>
						</el-input>
						<el-button-group style="margin-left: 5px">
							<el-button type="success" size="small" @click="createBlocks()">切分</el-button>
							<el-button type="info" size="small" @click="switchStep(-1)">返回</el-button>
						</el-button-group>
					</div>
				</div>
				<el-button class="btn-switch-line" type="info" icon="el-icon-refresh" circle plain size="mini" @click="switchLines" />
				<el-collapse accordion>
					<el-collapse-item :class="[ 'line-label', { 'base' : id == listQuery.baseLineId } ]" v-for="(line, id) in geoInfo.lines" :key="`lines_${id}`" :name="`lines_${id}`">
						<template slot="title">
							<el-radio v-model="listQuery.baseLineId" :label="Number(id)">線段{{ id }}({{ line.range[0] }} - {{ line.range[1] }}) - {{ line.len.toLocaleString() }}m</el-radio>
						</template>
						<el-row v-for="(point, index) in line.points" :key="`point_${index}`" type="flex" justify="center" align="middle">
							<el-col :span="6">
								<el-checkbox-group v-model="selectPt[id]" style="display: inline-flex; width: 100%;" @change="resetLines()">
									<el-checkbox style="margin: auto" :label="lineIndex(line.range[0], index) " :key="`checkBox_${index}`">{{ lineIndex(line.range[0], index) }}</el-checkbox>
								</el-checkbox-group>
							</el-col>
							<el-col :span="18">{{ [ point.lng, point.lat ] }}</el-col>
						</el-row>
					</el-collapse-item>
				</el-collapse>
			</el-card>

			<el-card v-show="stepOrder == 2 && geoInfo.blocks.length != 0" class="road-info">
				<div slot="header">
					<div class="info-title">切塊資訊</div>
					<div class="info-btn">
						<el-input v-model="listQuery.roadCode" placeholder="請輸入">
							<span slot="prepend">道路編碼</span>
						</el-input>
						<el-select v-model="listQuery.roadDir" popper-class="type-select" style="width: 40px">
							<el-option v-for="(name, id) in options.roadDir" :key="id" :label="name" :value="Number(id)" />
						</el-select>
						<el-button-group style="margin-left: 5px">
							<el-button type="success" size="small" @click="setBlock()">送出</el-button>
							<el-button type="info" size="small" @click="switchStep(-1)">返回</el-button>
						</el-button-group>
					</div>
				</div>
				<el-table
					ref="blockTable"
					empty-text="目前沒有資料"
					:data="geoInfo.blocks"
					fit
					highlight-current-row
					:header-cell-style="{'background-color': '#F2F6FC'}"
					:row-class-name="({row, rowIndex})=>{row.index = rowIndex; return 'block-table-row';}"
					style="width: 100%"
					@selection-change="(selection) => selectBlock = selection"
					@cell-mouse-enter="handleMouseEnter"
					@cell-mouse-leave="handleMouseLeave"
				>
					<el-table-column type="selection" width="45" align="center" />
					<el-table-column
						v-for="(text, key) in headersInfo.block"
						:key="key"
						:prop="key"
						:label="text"
						align="center"
						:formatter="formatter"
					>
						<template slot-scope="{ row, column }">
							<span v-if="[ 'blockId' ].includes(column.property)" class="road-code">
								<el-input v-model="row[column.property]" size="mini">
									<span slot="prepend">{{ listQuery.roadCode || "-" }}</span>
									<span slot="append">{{ listQuery.roadDir }}</span>
								</el-input>
							</span>
							<span v-else>{{ row[column.property] || "-" }}</span>
						</template>
					</el-table-column>
				</el-table>
			</el-card>
		</div>

		<!-- 操作 -->
		<div class="action-box">
			<el-button class="btn-MapType" icon="el-icon-copy-document" size="small" :style="`color: ${options.mapList[mapType].color}`" @click="setMapType">{{ options.mapList[mapType].name }}</el-button>
		</div>
	</div>
</template>

<script>
import { Loader } from "@googlemaps/js-api-loader";
import moment from "moment";
const { calcDistance, calArea, calVecAngle } = require('@/utils/geo-tools');
import { getRoadUnitGeo, getLaneUnitGeo, setLaneBlockGeo, setRoadBlockGeo } from "@/api/road";

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
	name: "roadUnitGen",
	components: { },
	data() {
		return {
			loading: false,
			screenWidth: window.innerWidth,
			stepOrder: 0,
			splitType: 0,
			areaLimit: [139, 325],
			mapType: 'hybrid',
			map: null,
			dataLayer: null,
			infoWindow: null,
			markers: [],
			polyLines: [],
			boundaryJSON: {},
			geoJSON_Ori: {},
			geoJSON_Split: {},
			geoInfo: {
				lastCode: 0,
				laneCode: 0,
				roadName: "",
				lane: 0,
				area: 0,
				points: [],
				lines: [],
				blocks: []
			},
			isShortBound: false,
			boundary: [],
			listQuery: {
				codeType: 1,
				roadId: null,
				laneCode: null,
				roadCode: null,
				roadDir: 0,
				splitLane: 3,
				splitLen: 20,
				baseLineId: 1
			},
			selectPt: {},
			selectBlock: [],
			lineFilter: {},
			headersInfo: {
				road: {
					roadName: "道路名稱",
					area: "面積"
				},
				// line: {
				// 	index: "序號",
				// 	point: "座標"
				// },
				block: {
					blockId: "單位編碼",
					area: "面積"
				}
			},
			options: {
				codeType: {
					1: {
						name: "道路Id",
						params: "roadId"
					},
					2: {
						name: "車道編碼",
						params: "laneCode"
					}
				},
				mapList: {
					roadmap: {
						name: "地圖",
						color: "#B22222",
					},
					hybrid: {
						name: "衛星(Google)",
						color: "#00BFFF",
					},
					hybridTaipei: {
						name: "衛星(台北)",
						color: "#483D8B",
					},
					topoTaipei: {
						name: "地形(台北)",
						color: "#228B22",
					}
				},
				line: {
					base: {
						color: "#EF5350",
						width: 6
					},
					others: {
						color: "#827717",
						width: 5
					}
				},
				roadDir: {
					0: "無",
					1: "順",
					2: "逆"
				}
			},
			iconStyle: { }
		};
	},
	computed: { 
		bJSONLevel() {
			if(this.boundaryJSON.type == undefined ) return 0;
			return this.boundaryJSON.type.includes('Multi') ? 1 : 0
		}
	},
	watch: {
		"listQuery.baseLineId"() {
			for(const [ id, polyline ] of Object.entries(this.polyLines)) {
				polyline.setOptions({ 
					strokeColor: id == this.listQuery.baseLineId ? this.options.line.base.color : this.options.line.others.color,
					strokeWeight: id == this.listQuery.baseLineId ? this.options.line.base.width : this.options.line.others.width,
				});
			}
		}
	},
	created() { },
	mounted() {
		// Google Map錯誤處理
		window.gm_authFailure = () => { 
			console.log("Google Map Failure");
			// session.devMode: 時效5分鐘
			sessionStorage.devMode = true;
			sessionStorage.dueTime = new Date().getTime() + (5*60*1000);
			location.reload();
		};

		// 初始化Google Map
		loader.load().then(() => {
			this.initMap();

			if (this.$route.query.roadId) {
				this.listQuery.codeType = 1;
				this.listQuery.roadId = this.$route.query.roadId;
				this.getList();
			}else if (this.$route.query.laneCode) {
				this.listQuery.codeType = 2;
				this.listQuery.laneCode = this.$route.query.laneCode;
				this.getList();
			}
		}).catch(err => console.log("err: ", err));
	},
	methods: {
		// init google map
		async initMap() {
			// 預設顯示的地點：台北市政府親子劇場
			const location = {
				lat: 25.0374865, // 經度
				lng: 121.5647688, // 緯度
			};

			// 建立地圖
			this.map = new google.maps.Map(this.$refs.map, {
				center: location, // 中心點座標
				zoom: 13, // 1-20，數字愈大，地圖愈細：1是世界地圖，20就會到街道
				maxZoom: 30,
				minZoom: 13,
				/*
					roadmap 顯示默認道路地圖視圖。
					satellite 顯示 Google 地球衛星圖像。
					hybrid 顯示正常和衛星視圖的混合。
					terrain 顯示基於地形信息的物理地圖。
				*/
				mapTypeId: "hybrid",
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
						stylers: [{ color: "#314054"}]
					},
					{
						elementType: "labels.text.fill",
						stylers: [{ color: "#746855" }]
					},
					{
						elementType: "labels.text.stroke",
						stylers: [{ color: "#242F3E" }]
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
						stylers: [{ color: "#38414E" }]
					},
					{
						featureType: "road",
						elementType: "geometry.stroke",
						stylers: [{ color: "#212A37" }]
					},
					{
						featureType: "road",
						elementType: "labels",
						stylers: [{ visibility: "off" }]
					},
					{
						featureType: "road.highway",
						elementType: "geometry",
						stylers: [{ color: "#746855" }]
					},
					{
						featureType: "road.highway",
						elementType: "geometry.stroke",
						stylers: [{ color: "#1F2835" }]
					},
					{
						featureType: "road.highway",
						elementType: "labels.text.fill",
						stylers: [{ color: "#F3D19C" }]
					},
					{
						featureType: "road.local",
						elementType: "labels",
						stylers: [{ visibility: "off" }]
					},
					{
						featureType: "transit",
						elementType: "all",
						stylers: [{ visibility: "off" }],
					},
					// {
					// 	featureType: "water",
					// 	elementType: "geometry",
					// 	stylers: [{ color: "#17263C" }]
					// },
					// {
					// 	featureType: "water",
					// 	elementType: "labels.text.fill",
					// 	stylers: [{ color: "#515C6D" }]
					// },
					// {
					// 	featureType: "water",
					// 	elementType: "labels.text.stroke",
					// 	stylers: [{ color: "#17263C" }]
					// }
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

			// NOTE: 台北都發局 正射圖
			const hybridTaipeiMapType = new google.maps.ImageMapType({
				name: 'hybridTaipei',
				tileSize: new google.maps.Size(256, 256),
				isPng: true,
				maxZoom: 21,
				minZoom: 13,
				getTileUrl: function (coord, zoom) {
					return (
						`https://www.historygis.udd.gov.taipei/arcgis/rest/services/Aerial/Ortho_2022/MapServer/WMTS/tile/1.0.0/Aerial_Ortho_2022/default/GoogleMapsCompatible/${zoom}/${coord.y}/${coord.x}`
					);
				}
			});
			this.map.mapTypes.set("hybridTaipei", hybridTaipeiMapType);

			// NOTE: 台北都發局 地形圖
			const topoTaipeiMapType = new google.maps.ImageMapType({
				name: 'topoTaipei',
				tileSize: new google.maps.Size(256, 256),
				isPng: true,
				maxZoom: 21,
				minZoom: 13,
				getTileUrl: function (coord, zoom) {
					return (
						`https://www.historygis.udd.gov.taipei/arcgis/rest/services/TOPO/DGN_2022/MapServer/WMTS/tile/1.0.0/TOPO_DGN_2022/default/GoogleMapsCompatible/${zoom}/${coord.y}/${coord.x}.png`
					);
				}
			});
			this.map.mapTypes.set("topoTaipei", topoTaipeiMapType);

			this.dataLayer = new google.maps.Data({ map: this.map });
			this.infoWindow = new google.maps.InfoWindow({ pixelOffset: new google.maps.Size(0, -5) });

			// marker icon格式
			this.iconStyle = {
				placemark_circle: {
					url: "http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png",
					anchor: new google.maps.Point(15, 15),
					scaledSize: new google.maps.Size(30, 30)
				},
				ylw_blank: {
					url: "https://maps.google.com/mapfiles/kml/paddle/ylw-blank.png",
					anchor: new google.maps.Point(15, 30),
					scaledSize: new google.maps.Size(30, 30)
				},
				grn_pushpin: {
					url: "https://maps.google.com/mapfiles/kml/pushpin/grn-pushpin.png",
					anchor: new google.maps.Point(10, 35),
					scaledSize: new google.maps.Size(35, 35)
				}
			}
		},
		setMapType() {
			const mapKeyList = Object.keys(this.options.mapList);
			let index = mapKeyList.indexOf(this.mapType);
			index = (index+1) % mapKeyList.length;
			this.mapType = mapKeyList[index];
			this.map.setMapTypeId(this.mapType);
		},
		getList() {
			if(!Number(this.listQuery.roadId) && !Number(this.listQuery.laneCode)) {
				this.$message({
					message: "請輸入正確編碼",
					type: "error",
				});
			} else {
				this.loading = true;
				this.clearAll();
				this.markers = [];
				this.polyLines = {};
				this.splitType = this.listQuery.codeType;

				if(this.listQuery.codeType == 1) {
					const query = { roadId: this.listQuery.roadId };
					this.$router.push({ query });
					getRoadUnitGeo({ ...query, splitType: 1 }).then(response => {
						if(Object.keys(response.data.result.geo).length == 0 || response.data.result.geo.boundary == null) {
							this.$message({
								message: "查無資料",
								type: "error",
							});
							this.geoInfo.roadName = response.data.result.geo.roadName || "";
							this.loading = false;

						} else this.createBoundary(response.data)

						this.loading = false;
					}).catch(err => this.loading = false);

				} else if(this.listQuery.codeType == 2) {
					const query = { laneCode: this.listQuery.laneCode };
					this.$router.push({ query });

					getLaneUnitGeo(query).then(response => {
						if(Object.keys(response.data.result.geo).length == 0 || response.data.result.geo.boundary == null) {
							this.$message({
								message: "查無資料",
								type: "error",
							});
							this.geoInfo.roadName = response.data.result.geo.roadName || "";
							this.loading = false;

						} else this.createBoundary(response.data)

						this.loading = false;
					}).catch(err => this.loading = false);
				}
			}
		},
		createBoundary(geoData) {
			this.boundaryJSON = JSON.parse(geoData.result.geo.boundary);

			this.geoInfo = {
				roadId: geoData.result.geo.RoadId,
				laneId: geoData.result.geo.laneId,
				laneCode: geoData.result.geo.laneCode,
				roadName: geoData.result.geo.roadName,
				lastCode: geoData.result.lastCode,
				lane: geoData.result.geo.lane,
				area: geoData.result.geo.area,
				points: [],
				lines: [],
				blocks: []
			};

			// 顯示該路段已完成區塊
			let geoJSON_Unit = { 
				"type": "FeatureCollection",
				"name": "polyJSON",
				"features": []
			};

			for(const geo of geoData.result.unitList) geoJSON_Unit.features.push({
				"type": "Feature",
				"properties": {
					"roadCode": geo.roadCode,
					"roadName": geo.roadName,
				},
				"geometry": JSON.parse(geo.geoJSON)
			})

			this.dataLayer.addGeoJson(geoJSON_Unit);
			this.dataLayer.setStyle({ 
				strokeColor: '#D81B60',
				strokeWeight: 2,
				strokeOpacity: 1,
				fillColor: '#607D8B',
				fillOpacity: 0.4,
				zIndex: 1
			});

			this.dataLayer.addListener('mouseover', (event) => {
				// console.log(event);
				this.infoWindow.setContent(`道路編碼: ${event.feature.getProperty("roadCode")}`);
				const bounds = new google.maps.LatLngBounds();
				const geometry = event.feature.getGeometry();
				geometry.forEachLatLng(position => bounds.extend(position));
				this.infoWindow.setPosition(bounds.getCenter());

				this.infoWindow.open(this.map);
			});

			this.dataLayer.addListener('mouseout', (event) => {
				this.infoWindow.close();
			});

			// 建立道路外框
			const resJSON = JSON.parse(geoData.result.geo.geoJSON);
			this.geoJSON_Ori = { 
				"type": "FeatureCollection",
				"name": "polyJSON",
				"features": [
					{
						"type": "Feature",
						"properties": {},
						"geometry": resJSON
					}
				]
			};
			
			this.map.data.addGeoJson(this.geoJSON_Ori);
			this.map.data.setStyle({ 
				strokeWeight: 1,
				strokeOpacity: 0.5,
				fillColor: '#409EFF',
				fillOpacity: 0.4
			});

			const level = resJSON.type.includes('Multi') ? 2 : 1;
			const paths = resJSON.coordinates.flat(level).map(point => ({ lat: point[1], lng: point[0] }));
			const bounds = new google.maps.LatLngBounds();
			paths.forEach(position => bounds.extend(position));
			this.map.fitBounds(bounds);
			this.createMarkers();
		},
		setBlock() {
			if(this.listQuery.roadCode == null || this.listQuery.roadCode.length == 0) {
				this.$message({
					message: "請輸入道路編碼",
					type: "error",
				});
			} else { 
				let unitList = [];
				for(const block of this.selectBlock) {
					unitList.push({
						roadId: Number(this.geoInfo.roadId),
						roadCode: `${this.listQuery.roadCode}${block.blockId}${this.listQuery.roadDir}`,
						roadName: this.geoInfo.roadName,
						lane: this.geoInfo.lane,
						area: block.area,
						length: block.length,
						geometry: JSON.stringify(block.geometry)
					})
				}
				// console.log(unitList);

				if(this.splitType == 1) {
					setRoadBlockGeo({ unitList }).then(response => {
						if ( response.statusCode == 20000 ) {
							this.$message({
								message: "新增成功",
								type: "success",
							});

							this.stepOrder = 3;
							this.getList();
						} else {
							this.$message({
								message: "新增失敗",
								type: "error",
							});
						}
					}).catch(err => console.log(err))

				} else if(this.splitType == 2) {

					unitList.forEach(unit => unit.laneCode = Number(this.geoInfo.laneCode));

					setLaneBlockGeo({ unitList }).then(response => {
						if ( response.statusCode == 20000 ) {
							this.$message({
								message: "新增成功",
								type: "success",
							});

							this.stepOrder = 3;
							this.getList();
						} else {
							this.$message({
								message: "新增失敗",
								type: "error",
							});
						}
					}).catch(err => console.log(err))
				}
			}
		},
		switchStep(index) {
			// console.log(index, this.stepOrder);
			if(index >= this.stepOrder) return;
			if(index == -1) this.stepOrder--;
			else this.stepOrder = index;
		},
		createMarkers() {
			// 建立端點
			for(const [ index, point ] of this.boundaryJSON.coordinates.flat(this.bJSONLevel).entries()) {
				const [ lng, lat ] = point;
				// if(index != 0) this.geoInfo.lines[this.geoInfo.lines.length-1].push({ lat, lng });

				// const limit = Math.pow(10, -5);
				// if(Math.abs(bLat.min - lat) < limit || Math.abs(bLat.max - lat) < limit || Math.abs(bLng.min - lng) < limit|| Math.abs(bLng.max - lng) < limit) {
					if(index < this.boundaryJSON.coordinates.flat(this.bJSONLevel).length - 1) {
					// this.geoInfo.points.push({ index: index, position: { lat, lng } });
					// this.geoInfo.lines.push([{ lat, lng }]);
					const marker = new google.maps.Marker({
						title: `${index}: ${JSON.stringify(point)}`,
						index: index,
						isPin: false,
						isDel: false,
						map: this.map,
						position: { lat, lng },
						icon: this.iconStyle.ylw_blank
					})

					marker.addListener('click', (event) => {
						// console.log(event);
						if(this.stepOrder != 0) return;

						if(!marker.isPin) {
							marker.isPin = true;
							marker.isDel = false;
							this.geoInfo.points.push({ index: marker.index, position: event.latLng.toJSON() });
							marker.setLabel({
								// text: `${this.geoInfo.points.length}`,
								text: `${marker.index}`,
								color: 'white',
								fontSize: '20px',
								fontWeight: 'bold'
							});
							marker.setIcon(this.iconStyle.grn_pushpin);
						} else {
							marker.isPin = marker.isDel = false;
							marker.setLabel("");
							this.geoInfo.points = this.geoInfo.points.filter(point => point.index != marker.index);
							marker.setIcon(this.iconStyle.ylw_blank);
						}
					});

					marker.addListener('rightclick', (event) => {
						// console.log(event);
						if(this.stepOrder != 1) return;

						if(!marker.isDel) {
							marker.isDel = true;
							marker.isPin = false;
							marker.setLabel("");
							for(const id in this.selectPt) this.selectPt[id] = this.selectPt[id].filter(point => point != marker.index);
							this.resetLines();
							marker.setIcon(this.iconStyle.placemark_circle);
						} else {
							marker.isPin = marker.isDel = false;
							marker.setLabel("");
							const id = Object.keys(this.geoInfo.lines).filter(id => {
								const indexList = this.geoInfo.lines[id].points.map((_, index) => (this.lineIndex(this.geoInfo.lines[id].range[0], index)));
								return indexList.includes(marker.index)
							})[0];
							this.selectPt[id].push(marker.index);
							this.resetLines();
							marker.setIcon(this.iconStyle.ylw_blank);
						}
					});

					this.markers.push(marker);
				}
			}
			// }
		},
		splitLines() {
			if(this.geoInfo.points.length == 0 || this.geoInfo.points.length != 4) {
				this.$message({
					message: "請標記4個點",
					type: "error",
				});
			} else {
				this.geoInfo.points.sort((a, b) => (a.index - b.index));

				this.boundary = this.geoInfo.points.reduce((acc, cur, id, arr) => {
					const index = id+1 <= arr.length - 1 ? id+1 : 0;
					const dist = calcDistance(cur.position, arr[index].position);
					const endRange = arr[index].index != 0 ? arr[index].index : this.boundaryJSON.coordinates.flat(this.bJSONLevel).length - 1;
					acc.push({ range: [ cur.index, endRange ], dist });

					return acc;
				}, []);

				this.boundary.sort((a, b) => (b.dist - a.dist));
				if(this.boundary[0].range[0] == this.boundary[1].range[1] || this.boundary[0].range[1] == this.boundary[1].range[0]) [ this.boundary[1], this.boundary[2] ] = [ this.boundary[2], this.boundary[1] ];
				if(this.boundary[0].range[0] == this.boundary[1].range[1] || this.boundary[0].range[1] == this.boundary[1].range[0]) [ this.boundary[1], this.boundary[3] ] = [ this.boundary[3], this.boundary[1] ];
				
				const points = this.boundary.slice(0, 2).sort((a, b) => (a.range[0] - b.range[0]));
				this.createLines(points);
				this.stepOrder = 1;
			}
		},
		createLines(points) {
			for(const polyline of Object.values(this.polyLines)) polyline.setMap(null);
			this.polyLines = {};

			let index = 0;
			this.geoInfo.lines = this.boundaryJSON.coordinates.flat(this.bJSONLevel).reduce((acc, cur, id, arr) => {
				if(index > points.length - 1) return acc;
				let range = points[index].range;
				if(id < range[0]) return acc;

				const [ lng, lat ] = cur;
				if(Object.keys(acc).length == 0 || ( range[0] <= range[1] && id > range[1])) {
					// console.log(id, range[0], range[1]);
					if(id != range[0]) {
						if(++index > points.length - 1) return acc;
						range = points[index].range;
					}
					if(id >= range[0]) acc[index+1] = { range: range, points: [{ lat, lng }]};
					else acc[index+1] = { range: range, points: [] };
				} else if(id >= range[0]) {
					// console.log(id, range[0], range[1]); 
					acc[index+1].points.push({ lat, lng });

					if(range[0] > range[1] && id == arr.length-1) {
						for(let i = 1; i <= range[1]; i++) acc[index+1].points.push({ lat: arr[i][1], lng: arr[i][0]});
					}
				}
				return acc;
			}, {});

			for(const[ id, line] of Object.entries(this.geoInfo.lines)) {
				line.points = line.points.filter((point, index) => line.points.indexOf(point) == index);
				line.len = this.calcLineLen(line.points);

				this.$set(this.selectPt, String(id), Array.from({length: line.points.length}, (_, i) => this.lineIndex(line.range[0], i)));
			}

			// 建立線段
			for(const [ id, path ] of Object.entries(this.geoInfo.lines)) {
				this.polyLines[id] = new google.maps.Polyline({
					path: path.points,
					geodesic: true,
					strokeOpacity: 1,
					strokeColor: id == this.listQuery.baseLineId ? this.options.line.base.color : this.options.line.others.color,
					strokeWeight: id == this.listQuery.baseLineId ? this.options.line.base.width : this.options.line.others.width,
					index: 1,
					map: this.map
				});
			}
		},
		switchLines() {
			this.isShortBound = !this.isShortBound;
			const indexArr = this.isShortBound ? [2, 4] : [0, 2];
			const points = this.boundary.slice(indexArr[0], indexArr[1]).sort((a, b) => (a.range[0] - b.range[0]));
			this.createLines(points);
		},
		createBlocks() {
			this.resetLines();

			this.geoInfo.blocks = [];
			this.selectBlock = [];
			let splitPObj = {};
			splitPObj[this.listQuery.baseLineId] = this.splitLine(this.lineFilter[this.listQuery.baseLineId].points);
			for(const id in this.lineFilter) {
				if (id == this.listQuery.baseLineId) continue;
				splitPObj[id] = this.splitLine_Per(this.lineFilter[id].points, splitPObj[this.listQuery.baseLineId]);
			}
			for(const [id, splitPList] of Object.entries(splitPObj)) console.log(`${id}: ${splitPList.length}`);
			// console.log(JSON.parse(JSON.stringify(splitPObj)));

			this.geoJSON_Split = this.getGeoJson(splitPObj);
			// const geoJsonData = JSON.stringify(geoJSON_Split, null, 2);
			// console.log(geoJSON_Split);

			this.map.data.forEach(feature => this.map.data.remove(feature));
			this.map.data.addGeoJson(this.geoJSON_Split);
			this.map.data.setStyle(feature => {
				// console.log(feature);
				return {
					strokeWeight: feature.getProperty("stroke-width"),
					strokeColor: feature.getProperty("stroke"),
					strokeOpacity: feature.getProperty("stroke-opacity"),
					fillOpacity: feature.getProperty("fill-opacity"),
					fillColor: feature.getProperty("fill")
				}
			});

			// this.map.data.forEach(feature => console.log(feature.getProperty("blockId")));

			// NOTE: test
			this.map.data.addListener("click", (event) => {
				console.log(`${event.feature.getProperty("area").toLocaleString()} ㎡`,);
			});

			const _this = this;
			this.map.data.addListener('mouseover', (event) => {
				const row = _this.geoInfo.blocks.filter((block) => block.blockId == event.feature.getProperty("blockId"))[0];
				if(_this.$refs.blockTable) _this.$refs.blockTable.setCurrentRow(row);
				_this.map.data.revertStyle();
				_this.map.data.overrideStyle(event.feature, { fillColor: "#FFF176" });
			});

			this.map.data.addListener('mouseout', (event) => {
				if(_this.$refs.blockTable) _this.$refs.blockTable.setCurrentRow();
				this.map.data.revertStyle();
			});

			this.$nextTick(() => _this.$refs.blockTable.toggleAllSelection());
			this.stepOrder = 2;
		},
		resetLines() {
			this.lineFilter = JSON.parse(JSON.stringify(this.geoInfo.lines));

			// 變更marker icon
			this.markers.forEach(marker => {
				// console.log(marker.index, this.selectPt[lineId]);
				if(!marker.isPin && Object.values(this.selectPt).flat().includes(marker.index)) marker.setIcon(this.iconStyle.ylw_blank);
				if(!marker.isPin && !Object.values(this.selectPt).flat().includes(marker.index))  marker.setIcon(this.iconStyle.placemark_circle);
			});

			Object.keys(this.geoInfo.lines).forEach(id => {
				// 調整lines的點
				const line = this.geoInfo.lines[id];
				// console.log(id, line.points);
				this.lineFilter[id].points = line.points.filter((_, i) => (this.selectPt[id].includes(this.lineIndex(line.range[0], i))));
				// console.log(lineFilter[id].points);

				// 變更線段
				const path = this.lineFilter[id].points;
				// console.log(id, path);
				this.polyLines[id].setPath(path);
			})
		},
		clearAll() {
			this.infoWindow.close();
			this.stepOrder = 0;
			this.dataLayer.forEach(feature => this.dataLayer.remove(feature));
			this.map.data.forEach(feature => this.map.data.remove(feature));
			for(const polyline of Object.values(this.polyLines)) polyline.setMap(null);
			for(const markers of this.markers) markers.setMap(null);
		},
		// 計算線段長度
		calcLineLen(points) {
			return points.reduce((acc, curr, index) => {
				if (index + 1 < points.length) acc += calcDistance(curr, points[index + 1]);
				return acc;
			}, 0);
		},
		// 線性插值
		interpolation(start, end, different) {
			const dist = calcDistance(start, end);
			const lat = different * (end.lat - start.lat) / dist + start.lat;
			const lng = different * (end.lng - start.lng) / dist + start.lng;
			return { lat, lng };
		},
		// 計算垂直點: { lat: -1, lng: -1 } -> 不在線段內
		getFootOfPer(start, end, pt) {
			const dLat = start.lat - end.lat; //Y
			const dLng = start.lng - end.lng; //X

			if (Math.abs(dLat) < 0.000000001 && Math.abs(dLng) < 0.000000001) return { lat: -1, lng: -1 };
			const u = ((pt.lng - start.lng) * dLng + (pt.lat - start.lat) * dLat) / (dLng * dLng + dLat * dLat);
			const footOfPer = { lat: start.lat + u * dLat, lng: start.lng + u * dLng };
			// console.log(calcDistance(start, footOfPer), calcDistance(start, end));

			if(calcDistance(start, footOfPer) > calcDistance(start, end)) return { lat: -1, lng: -1 };
			else return footOfPer;
		},
		// 切割線段 - 線段長度
		splitLine(linesPosSpec) {
			let pointList = [{ index: 0, point: linesPosSpec[0] }];
			let pointInfo = { dist: 0, index: 0, point: pointList[pointList.length - 1].point };
			
			for (let i = 0; i < linesPosSpec.length; i = pointInfo.index + 1) {
				pointInfo.point = pointList[pointList.length - 1].point;
				pointInfo.dist = 0;
				let dist = 0;
				for (const [index, point] of linesPosSpec.entries()) {
					if (index <= pointInfo.index) continue;
					dist += calcDistance(pointInfo.point, point);
					if (dist != 0 && dist <= this.listQuery.splitLen) pointInfo = { dist, index, point };
					else break;
				}

				if (pointInfo.index + 1 >= linesPosSpec.length) pointList.push({ index: linesPosSpec.length - 1, point: linesPosSpec[linesPosSpec.length - 1] });
				else {
					pointList.push({
						index: pointInfo.index,
						point: this.interpolation(pointInfo.point, linesPosSpec[pointInfo.index + 1], this.listQuery.splitLen - pointInfo.dist)
					});
				}
			}

			// 將最後兩格合併
			const lastIndex = pointList.length - 1;
			if(pointList.length > 2 && calcDistance(pointList[lastIndex-1].point, pointList[lastIndex].point) < this.listQuery.splitLen) pointList.splice(lastIndex-1, 1);

			return pointList
		},
		// 切割線段 - 垂直點
		splitLine_Per(linesPosSpec, splitPList) {
			let pointList = [{ index: linesPosSpec.length-1, point: linesPosSpec[linesPosSpec.length-1] }];
			let pointInfo = { index: 0, point: {} };

			for (const [ index, splitP ] of splitPList.entries()) {
				if(index == 0) continue;
				for (let i = linesPosSpec.length - 1; i >= 0; i--) {
					if (i - 1 < 0) pointList.push({ index: 0, point: linesPosSpec[0] });
					else {
						//解決垂直線投影
						const vector1 = { lat: linesPosSpec[i].lat - linesPosSpec[i-1].lat, lng: linesPosSpec[i].lng - linesPosSpec[i-1].lng };
						const vector2 = { lat: splitP.point.lat - splitPList[index-1].point.lat, lng: splitP.point.lng - splitPList[index-1].point.lng };
						const angle = calVecAngle(vector1, vector2);
						if(Math.abs(angle-180) >= 50) continue;

						const footOfPer = this.getFootOfPer(linesPosSpec[i], linesPosSpec[i-1], splitP.point);
						// console.log(i, angle, JSON.stringify(linesPosSpec[i]), JSON.stringify(linesPosSpec[i-1]), JSON.stringify(splitP.point), JSON.stringify(footOfPer));
						if (footOfPer.lat == -1 && footOfPer.lng == -1) continue;
						pointInfo.index = i;

						pointList.push({
							index: pointInfo.index,
							point: footOfPer
						});

						break;
					}
				}
			}

			// 將最後兩格合併
			const lastIndex = pointList.length - 1;
			if(calcDistance(pointList[lastIndex].point, linesPosSpec[0]) > 0) pointList[lastIndex].point = linesPosSpec[0];
			return pointList
		},
		splitBlock(splitPList1, splitPList2, line1, line2) {
			const limit = Math.max(splitPList1.length, splitPList2.length);
			let borders = [];
			let lenArr = [];
			// console.log(splitPList1, splitPList2);
			
			for (let i = 0; i < limit - 1; i++) {
				let splitPList1Curr, splitPList1Next, splitPList2Curr, splitPList2Next;
				
				if (i < splitPList1.length - 1) {
					splitPList1Curr = splitPList1[i];
					splitPList1Next = splitPList1[i + 1];
				} else splitPList1Curr = splitPList1Next = splitPList1[splitPList1.length - 1];

				if (i < splitPList2.length - 1) {
					splitPList2Curr = splitPList2[i];
					splitPList2Next = splitPList2[i + 1];
				} else splitPList2Curr = splitPList2Next = splitPList2[splitPList2.length - 1];

				// console.log(splitPList1Curr, splitPList1Next, splitPList2Curr, splitPList2Next);

				let border = [[splitPList1Curr.point.lng, splitPList1Curr.point.lat]];
				for (let a = splitPList1Curr.index + 1; a <= splitPList1Next.index; a++) border.push([line1[a].lng, line1[a].lat]);
				border.push([splitPList1Next.point.lng, splitPList1Next.point.lat]);
				lenArr.push(this.calcLineLen(border.map(point => ({ lat: point[1], lng: point[0] }))));
				border.push([splitPList2Next.point.lng, splitPList2Next.point.lat]);
				// for (let b = splitPList2Next.index; b >= splitPList2Curr.index + 1; b--) border.push([line2[b].lng, line2[b].lat]);
				for (let b = splitPList2Next.index; b <= splitPList2Curr.index - 1; b++) border.push([line2[b].lng, line2[b].lat]);
				border.push([splitPList2Curr.point.lng, splitPList2Curr.point.lat]);

				border.push([splitPList1Curr.point.lng, splitPList1Curr.point.lat]);

				// console.log(border);
				borders.push([ border ]);
			}
			return { borders, lenArr }
		},
		getGeoJson(splitPObj) {
			let geoJson = {
				"type": "FeatureCollection",
				"name": "splitJSON",
				"features": []
			};

			for (const [id, splitPList] of Object.entries(splitPObj)) {
				if(id == this.listQuery.baseLineId) continue;
				const { borders, lenArr } = this.splitBlock(splitPObj[this.listQuery.baseLineId], splitPList, this.lineFilter[this.listQuery.baseLineId].points, this.lineFilter[id].points);
				for (const [index, border ] of borders.entries()) {
					const area = calArea(border.flat());
					let fillColor = "#90CAF9";
					if(area < this.areaLimit[0] || area > this.areaLimit[1]) fillColor = "#EF5350";

					// console.log(border.flat().map(point => ({ lat: point[1], lng: point[0] })));
					const blockId = String(this.geoInfo.lastCode + index + 1).padStart(3, '0');
					const block = {
						blockId: blockId,
						area: Math.round(area * 100) / 100,
						length: Math.round(lenArr[index]*100) / 100,
						points: border.flat().map(point => ({ lat: point[1], lng: point[0] })),
						geometry: {
							type: "Polygon",
							coordinates: border
						}
					};
					this.geoInfo.blocks.push(block);

					const feature = {
						"type": "Feature",
						"properties": {
							"stroke": "#555555",
							"stroke-opacity": 0.5,
							"stroke-width": 1,
							"fill": fillColor,
							"fill-opacity": 0.8,
							"area": area,
							"blockId": blockId
						},
						"geometry": {
							"type": "Polygon",
							"coordinates": border
						}
					};
					geoJson.features.push(feature);
				}
			}

			return geoJson
		},
		handleMouseEnter(row, column, cell, event) {
			// console.log(row.blockId);
			
			this.map.data.revertStyle();
			this.map.data.forEach(feature => {
				if(feature.getProperty("blockId") == row.blockId) this.map.data.overrideStyle(feature, { fillColor: "#FFF176" });
			});
		},
		handleMouseLeave(row, column, cell, event) {
			// console.log(row.blockId);
			this.map.data.revertStyle();
		},
		lineIndex(min, index) {
			const polyMax = this.boundaryJSON.coordinates.flat(this.bJSONLevel).length - 1;
			const lineIndex = (min + index) % polyMax;
			return lineIndex;
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
.road-unitGen
	position: relative
	height: 100%
	width: 100%
	.header-bar
		position: absolute
		top: 0
		z-index: 1
		padding-left: 10px
		.road-title
			text-shadow: 0px 0px 5px white
			text-stroke: 0.6px white
			-webkit-text-stroke: 0.6px white
		.el-select
			width: 85px
			.el-input__inner
				padding-left: 3px
				padding-right: 10px
				text-align: center
			.el-input__suffix
				right: 0
				margin-right: -3px
				transform: scale(0.7)
		.step-box
			width: 600px
			margin-left: 100px
			.el-steps.el-steps--simple
				padding: 5px 40px 5px 20px
			.el-step__icon-inner.el-icon-add-location
				font-size: 24px
			.el-step__head.is-finish, .el-step__title.is-finish
				cursor: pointer
			.el-step__main
				margin: 0 20px 0 -8px
				.el-step__title, .el-step__arrow
					max-width: 100%
					text-align: center
					cursor: default
					flex: 3
				.el-step__arrow
					flex: 1
	.info-box
		position: absolute
		top: 150px
		left: 10px
		z-index: 1
		.road-info
			width: 360px
			background-color: rgba(white, 0.7)
			margin: 5px
			// padding: 5px
			font-size: 18px 
			color: #555
			.el-input-group__prepend, input
				padding: 0 5px
				text-align: center
			.el-select
				width: 85px
				.el-input__inner
					padding-left: 3px
					padding-right: 10px
					text-align: center
				.el-input__suffix
					right: 0
					margin-right: -3px
					transform: scale(0.7)
			.el-card__body
				max-height: 400px
				overflow-x: hidden
				overflow-y: auto
			.btn-switch-line
				position: relative
				margin-left: 90%
				margin-bottom: 5px
			.info-title
				font-weight: bold
				margin-bottom: 5px
			input[type=number]
				padding: 0
				overflow: hidden
				text-align: center
				&::-webkit-inner-spin-button
					transform: scale(1.2, 1) translateX(-11%)
			.info-btn
				display: inline-flex
				align-items: center
				margin-bottom: 5px
				.el-input-group--prepend
					flex: 2
			.line-label
				width: 100%
				.el-collapse-item__header
					background-color: rgba(#827717, 0.8)
					padding: 5px
					&.is-active
						transition: 0.5s
				&.base .el-collapse-item__header
					background-color: rgba(#EF5350, 0.8)
				.el-collapse-item__content
					height: 100%
			.block-table-row
				cursor: pointer
				.road-code
					.el-input-group__prepend, .el-input-group__append, input
						padding: 0 2px
						text-align: center
					.el-input-group__prepend
						width: 70px
					.el-input-group__append
						width: 10px
	.action-box
		.btn-MapType
			position: absolute
			top: 24px
			right: 24px
			background-color: rgba(white, 0.8)
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
</style>