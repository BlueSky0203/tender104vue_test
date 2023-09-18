<template>
	<div class="car-route" v-loading="loading"> 
		<div class="header-bar">
			<h2 class="route-title">車巡管理
				<!-- <span v-if="carId.length != 0" class="route-info">車號 {{ carId }} (路線 {{ listQuery.inspectionId }})</span> -->
				<span v-if="carId.length != 0" class="route-info">{{ searchRange }}</span>
			</h2>
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
				<el-select v-model="listQuery.contractId" placeholder="請選擇">
					<el-option v-for="(text, id) in options.contractId" :key="`contractId_${id}`" :label="text" :value="Number(id)" />
				</el-select>

				<el-select v-model="listQuery.carId" placeholder="請選擇" @change="getCarList()">
					<el-option v-for="(text, id) in options.carId[listQuery.contractId]" :key="`car_${id}`" :label="text" :value="Number(id)" />
				</el-select> 

				<!-- NOTE: 種類先隱藏 -->
				<!-- <el-select v-model="listQuery.modeId" @change="getCarList()">
					<el-option v-for="(text, id) in options.modeId" :key="`model_${id}`" :label="text" :value="Number(id)" />
				</el-select> -->
				<!-- NOTE: 路線先隱藏 -->
				<!-- <el-select v-model="listQuery.inspectionId" placeholder="請選擇路線" @change="getCarInfo()">
					<el-option v-for="car in carList" :key="`car_${car.id}`" :label="`路線${car.id} (${car.carId})`" :value="Number(car.id)" />
				</el-select> -->

				<span class="time-picker">
					<el-button-group v-if="!dateTimePickerVisible">
						<el-button
							v-for="(t, i) in pickerOptions.shortcuts"
							:key="i"
							type="primary"
							:plain="i != timeTabId"
							size="mini"
							@click="dateShortcuts(i)"
						>{{ t.text }}</el-button>
					</el-button-group>
					<el-date-picker
						v-else
						class="filter-item"
						v-model="searchDate"
						type="date"
						placeholder="日期"
						:picker-options="pickerOptions"
						:clearable="false"
						@change="timeTabId = -1"
					/>
					<el-button
						:type="dateTimePickerVisible ? 'info' : 'primary'"
						plain
						size="mini"
						@click="dateTimePickerVisible = !dateTimePickerVisible"
					>{{ dateTimePickerVisible ? '返回' : '進階' }}</el-button>
					<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getCarList()">搜尋</el-button>
				</span>
			</div>
		</div>
		<el-row>
			<el-col :span="16">
				<div id="map" ref="map" />
			</el-col>
			<el-col class="info-panel" :span="8">
				<div class="car-vod-panel">
					<i class="el-icon-video-camera" v-if="carVodList.length == 0"/>
					<el-tabs v-else v-model="activeVodName" class="vod-tabs" tab-position="bottom">
						<el-tab-pane v-for="(vod, index) in carVodList" :key="`vod_${index}`" :label="vod.label">
							<!-- <iframe width="720" height="405" src="https://www.youtube.com/embed/d148YHkaAGg?controls=0&autoplay=1&mute=1&rel=0&modestbranding=1" frameborder="0" allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture;" /> -->
							<!-- <iframe src="http://bimtest.sytes.net:5080/WebRTCAppEE/play.html?name=246612205179051969409588&autoplay=true" frameborder="0" /> -->
							<iframe v-if="activeVodName == index" width="560" height="315" :src="vod.vodUrl" frameborder="0" allowfullscreen allow="autoplay" />
							<!-- <video width="560" height="315" controls autoplay>
								<source :src="vod.vodUrl" type="video/mp4">
							</video> -->
						</el-tab-pane>
					</el-tabs>
				</div>
				<div class="car-info-panel">
					<i class="el-icon-truck" />
					<div v-if="Object.keys(carInfo).length > 0" class="car-info">
						<el-row v-for="(text, key) in headers" :key="key" >
							<el-col :span="8">{{ text }}: </el-col>
							<el-col :span="16">
								<span v-if="key == 'pathId'">週期{{ carInfo[key] }}</span>
								<span v-else-if="key == 'carId'">{{ options.carId[carInfo.contractId][carInfo[key]] }}</span>
								<!-- NOTE: 測試DEMO用 -->
								<span v-else-if="key == 'driverId'">王小明</span>
								<span v-else>{{ carInfo[key] }}</span>
							</el-col>
						</el-row>
					</div>
				</div>
			</el-col>
		</el-row> 

		<!-- <h5 v-if="list.length != 0">查詢期間：{{ searchRange }}</h5> -->

		<!-- <el-table
			empty-text="目前沒有資料"
			:data="list"
			border
			fit
			highlight-current-row
			:header-cell-style="{'background-color': '#F2F6FC'}"
			stripe
			style="width: 100%"
		>
			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:formatter="formatter"
				:sortable="value.sortable"
			/>
		</el-table> -->
		<!-- <el-dialog v-el-drag-dialog class="streaming" :visible="true" width="720px" :modal="false" :modal-append-to-body="false" :append-to-body="false" :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false" center> -->
			<!-- <iframe width="720" height="405" src="https://www.youtube.com/embed/d148YHkaAGg?controls=0&autoplay=1&mute=1&rel=0&modestbranding=1" frameborder="0" allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture;" /> -->
			<!-- <iframe src="http://bimtest.sytes.net:5080/WebRTCAppEE/play.html?name=246612205179051969409588&autoplay=true" frameborder="0" width="720" height="405"></iframe>
		</el-dialog> -->

	</div>
</template>

<script>
import { Loader } from "@googlemaps/js-api-loader";
import moment from 'moment';
import { getInspectionList, getSpecInspection, getSpecInspectionTracks } from "@/api/car";
import { getInspectionRoute } from "@/api/inspection";
import elDragDialog from '@/directive/el-drag-dialog';

// 載入 Google Map API
const loaderOpt = {
	apiKey: "",
	version: "weekly",
	language: "zh-TW",
	region: "TW",
	libraries: ["places", "geocoding"],
};

// TODO: apiKey先關閉
if(!sessionStorage.devMode && process.env.VUE_APP_MAP_KEY != undefined) loaderOpt.apiKey = process.env.VUE_APP_MAP_KEY;
const loader = new Loader(loaderOpt);

export default {
	name: "carRoute",
	directives: { elDragDialog },
	data() {
		return {
			loading: false,
			mediaAPIUrl: process.env.VUE_APP_MEDIA_API,
			mediaGCSUrl: process.env.VUE_APP_MEDIA_URL,
			showLayerAttach: false,
			map: null,
			polyLine: null,
			markers: {
				start: null,
				end: null
			},
			activeVodName: "",
			timeTabId: 0,
			dateTimePickerVisible: false,
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
			listQuery: {
				contractId: 1,
				modeId: 3,
				carId: 1,
				inspectionId: ""
			},
			headers: {
				// id: "路線",
				pathId: "週期",
				carId: "車號",
				driverId: "駕駛",
				modeId: "巡查方式",
				createdAt: "開始時間"
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
				modeId: {
					1: "手持巡查",
					2: "手持巡查(AI)",
					3: "車輛巡查",
					4: "車輛巡查(AI)"
				},
				contractId: {
					1: "一標",
					2: "二標",
					3: "三標",
					4: "四標",
					5: "五標",
					// 6: "六標"
				},
				carId: {
					1: {
						// 1: "ATE-5102",
						1: "RDX-6883",
						2: "RDQ-6279",
						// 3: "ATE-3192",
						3: "RDX-6881",
					},
					2: {
						1: "ATE-3236",
						2: "BFX-7552",
					},
					3: {
						1: "ALV-3038",
						2: "APD-3308",
						3: "AAA-0000",
					},
					4: {
						1: "ATE-3287",
						2: "ATE-3192",
					},
					5: {
						1: "BPG-0891",
						2: "BFX-7551",
					}
				},
			},
			carList: [],
			carVodList: [],
			carInfo: [],
			carTracks: []
		};
	},
	computed: {
		carId() {
			const carFilterList = this.carList.filter(car => car.id == this.listQuery.inspectionId);
			return carFilterList.length > 0 ? carFilterList[0].carId : "";
		}
	},
	created() {
		this.dataLayer = { route: {} };

		// Google Map錯誤處理
		window.gm_authFailure = () => { 
			console.log("Google Map Failure");
			// session.devMode: 時效5分鐘
			sessionStorage.devMode = true;
			sessionStorage.dueTime = new Date().getTime() + (5*60*1000);
			location.reload();
		};

		// 初始化Google Map
		loader.load().then(() => this.initMap()).catch(err => console.log("err: ", err));
	},
	mounted() {
		this.getCarList();
	},
	methods: {
		// init google map
		initMap() {
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
				maxZoom: 19,
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

			// 建立marker
			this.markers.start = new google.maps.Marker({
				map: this.map,
				icon: {
					url: "/assets/icon/icon_redDot.png",
					anchor: new google.maps.Point(5, 5),
					scaledSize: new google.maps.Size(10, 10)
				}
			});

			this.markers.end = new google.maps.Marker({
				map: this.map,
				icon: {
					url: "/assets/icon/truck.png",
					anchor: new google.maps.Point(12, 12),
					scaledSize: new google.maps.Size(24, 24)
				}
			});

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

			// jsts
			this.geometryFactory = new jsts.geom.GeometryFactory();
		},
		dateShortcuts(index) {
			this.timeTabId = index;

			const DATE_OPTION = {
				TODAY: 0,
				YESTERDAY: 1,
				DAYBEFOREYEST: 2
			};

			switch (index) {
				case DATE_OPTION.TODAY:
					this.searchDate = moment();
					break;
				case DATE_OPTION.YESTERDAY:
					this.searchDate = moment().subtract(1, "d");
					break;
				case DATE_OPTION.DAYBEFOREYEST:
					this.searchDate = moment().subtract(2, "d");
					break;
			}
			this.getCarList();
		},
		getCarList() {
			this.loading = true;
			this.carList = [];
			this.carInfo = {};
			this.carVodList = [];
			this.carTracks = [];
			this.listQuery.inspectionId = "";
			if(this.polyLine != undefined) this.polyLine.setMap(null);
			for(const marker of Object.values(this.markers).filter(marker => marker != null)) marker.setMap(null);

			const date = moment(this.searchDate).format("YYYY-MM-DD");
			this.searchRange = date;

			getInspectionList({
				contractId: this.listQuery.contractId,
				modeId: this.listQuery.modeId,
				carId: this.listQuery.carId,
				date: date
			}).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
					this.loading = false;
				} else {
					this.carList = response.data.list;

					//NOTE: 因為一天只會有一次車巡，所以取第一筆
					this.listQuery.inspectionId = this.carList[0].id;
					this.getCarInfo();
				}
				// this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		getCarInfo() {			
			getSpecInspection(this.listQuery.inspectionId).then(response => {
				if (Object.keys(response.data).length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
					this.loading = false;
				} else {
					this.carInfo = response.data;
					this.carInfo.modeId = this.options.modeId[this.carInfo.modeId];
					this.carInfo.createdAt = this.formatTime(this.carInfo.createdAt);
					this.carVodList.push({
						label: "即時",
						vodUrl: `${this.mediaAPIUrl}WebRTCAppEE/play.html?name=${this.carInfo.liveStreamId}`
					});

					this.getCarVideo();
					this.getCarTrack();
				}
				// this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		getCarVideo() {
			fetch(`${this.mediaAPIUrl}WebRTCAppEE/rest/v2/vods/list/0/10?streamId=${this.carInfo.liveStreamId}&sort_by=date`).then((response) => (response.json()))
				.then(response => {
					// console.log(response);
					this.carVodList.push(...response.sort((a,b) => (a.startTime - b.startTime)).map(vod => ({
						time: vod.startTime,
						label: this.formatTime(vod.startTime).split(" ")[1],
						vodUrl: `${this.mediaGCSUrl}${vod.vodName}`
					})));

					// this.loading = false;
				}).catch(err => { this.loading = false; });
		},
		getCarTrack() {
			// if(this.polyLine != undefined) this.polyLine.setMap(null);
			// for(const marker of Object.values(this.markers)) marker.setMap(null);
			this.dataLayer.route.revertStyle();

			getSpecInspectionTracks(this.listQuery.inspectionId).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
					this.loading = false;
				} else {
					this.carTracks = response.data.list;

					const paths = this.carTracks.map(point => ({ lat: point.lat, lng: point.long }));
					// 建立路線
					this.polyLine = new google.maps.Polyline({
						path: paths,
						geodesic: true,
						strokeColor: "#9E9D24",
						strokeOpacity: 1,
						strokeWeight: 5,
						map: this.map
					})

					const bounds = new google.maps.LatLngBounds();
					paths.forEach(position => bounds.extend(position));
					this.map.fitBounds(bounds);

					this.markers.start.setPosition(paths[paths.length-1]);
					this.markers.end.setPosition(paths[0]);
					for(const marker of Object.values(this.markers)) marker.setMap(this.map);
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
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
		intersectRoute() {
			this.dataLayer.route.revertStyle();
			const jstsRoutePoints = this.carTracks.map(point => this.createJstsGeometry([[ point.long, point.lat ]]));
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
		formatter(row, column) {
			if(Number(row[column.property])) return row[column.property].toLocaleString();
			else return row[column.property];
		},
		formatTime(time) {
			return moment(time).format("YYYY-MM-DD HH:mm:ss");
		},
		handleDownload() {
			let tHeader = Object.values(this.headers);
			let filterVal = Object.keys(this.headers);
			// tHeader = [ "日期", "星期", "DAU", "新增帳號數", "PCU", "ACU", "儲值金額", "DAU帳號付費數", "DAU付費率", "DAU ARPPU", "DAU ARPU", "新增帳號儲值金額", "新增帳號付費數", "新增付費率", "新增帳號ARPPU", "新增帳號ARPU" ]
			// filterVal = [ "date", "weekdayText", "dau", "newUser", "pcu", "acu", "amount", "dauPaid", "dauPaidRatio", "dauARPPU", "dauARPU", "newUserAmount", "newUserPaid", "newUserPaidRatio", "newUserARPPU", "newUserARPU" ]
			let data = this.formatJson(filterVal, this.list);

			import("@/vendor/Export2Excel").then((excel) => {
				excel.export_json_to_excel({
					header: tHeader,
					data,
				});
			});
		},
		formatJson(filterVal, jsonData) {
			return jsonData.map((v) => filterVal.map((j) => v[j]));
		}
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.car-route
	position: relative
	height: 100%
	width: 100%
	.header-bar
		position: absolute
		top: 0
		z-index: 1
		padding-left: 10px
		.route-title
			text-stroke: 0.6px white
			-webkit-text-stroke: 0.6px white
			.route-info
				background-color: rgba(white, 0.5)
				padding: 0 5px
				font-size: 18px 
				color: #555
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
		// .streaming
		// 	z-index: 0 !important
		// 	.el-dialog
		// 		top: -20px
		// 		left: -350px
		// 		.el-dialog__header
		// 			height: 0
		// 			background-color: #409EFF
		// 		.el-dialog__body
		// 			padding: 0
		// 			height: 405px
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
	.info-panel
		height: calc(100vh - 50px)
		background-color: #E6EE9C
		.car-vod-panel
			position: relative
			height: calc(100vw / 3 / 1.5 + 40px) 
			width: 100%
			background-color:#E0F7FA
			i.el-icon-video-camera
				position: absolute
				top: 30%
				left: 50%
				transform: translateX(-50%)
				color: white
				font-size: 1000%
				opacity: 0.8
			.vod-tabs
				iframe
					height: calc(100vw / 3 / 1.5)
					width: 100%
				.el-tabs__header
					margin-top: 0
					padding: 0 10px
		.car-info-panel
			position: relative
			height: 60%
			width: 100%
			i.el-icon-truck
				position: absolute
				bottom: 30%
				left: 50%
				transform: translateX(-50%)
				color: white
				font-size: 1000%
				opacity: 0.8
			.car-info
				padding: 20px
</style>