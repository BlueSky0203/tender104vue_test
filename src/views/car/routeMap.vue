<template>
	<div class="car-route" v-loading="loading"> 
		<div class="header-bar">
			<h2 class="route-title">巡視路線(分隊)
				<!-- <span v-if="carId.length != 0" class="route-info">車號 {{ carId }} (路線 {{ listQuery.inspectionId }})</span> -->
				<span v-if="carId.length != 0" class="route-info">{{ searchRange }}</span>
			</h2>
			<el-card v-if="caseInfo.length != 0" class="info-box" shadow="never">
				<el-row v-for="(info, index) in caseInfo" :key="`caseInfo_${info.showName}_${index}`" class="color-box" type="flex" :style="`background-color: ${info.active ? info.color : '#eee'}; cursor: pointer`" @click.native="info.active = !info.active; caseFilter();">
					<el-col :span="5"><el-image :src="info.icon" fit="scale-down" style="height: 30px" /></el-col>
					<el-col :span="12" style="padding: 0 5px">{{ info.showName || info.caseName }}</el-col>
					<el-col :span="5">
						<span>{{ info.total }}</span>
					</el-col>
				</el-row>
			</el-card>
			<div class="filter-container">
				<span class="filter-item">
					<div class="select-district el-input el-input--medium el-input-group el-input-group--prepend">
						<el-select v-model="listQuery.contractId" placeholder="請選擇" style="width: 75px; margin-right:20px;" size="small">
							<el-option label="全部" :value="99" />
							<el-option v-for="(text, id) in options.contractId" :key="`contractId_${id}`" :label="text" :value="Number(id)" />
						</el-select>

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
							<el-button style="margin-left: 20px;" size="small" class="filter-item" type="primary" icon="el-icon-search" @click="getList()">搜尋</el-button>
							<el-switch style="margin-left: 10px;" v-show="timeTabId == 5" v-model="autoRefresh" size="small" active-text="自動" />
						</span>
					</div>

					<span>
						<span style="margin-left: 18px;">週期</span>
						<el-button-group style="margin-left: 45px;">
							<el-button
								style="margin-left: 0"
								v-for="(name, id) in options.inspectRound"
								:key="id"
								@click="handleButton(id)"
								type="success"
								:value="Number(id)"
								size="small"
								plain>{{ name }}</el-button>
						</el-button-group>

						<!-- <el-select class="district-select" v-model="listQuery.inspectRound">
							<el-option v-for="(name, id) in options.inspectRound" :key="id" :label="name" :value="Number(id)" />
						</el-select> -->

						<!-- <el-button-group style="margin-left:20px;">
							<el-button type="primary" size="small" @click="getRouteList()">載入</el-button>
							<el-button type="success" size="small" @click="intersectRoute()">比對</el-button>
							<el-button type="info" size="small" @click="clearRouteLayer()">清空</el-button>
						</el-button-group> -->
					</span>
					<!-- <el-button :type="showLayerAttach ? 'primary' : 'info'" @click="showLayerAttach = !showLayerAttach">路線圖層</el-button> -->
					<!-- <el-card v-if="showLayerAttach" :body-style="{ padding: '0 5px', backgroundColor: 'rgba(255, 255, 255, 0.5)' }">
						<div class="filter-item">
							<div class="select-district el-input el-input--medium el-input-group el-input-group--prepend">
								<div class="el-input-group__prepend">
									<span>行政區</span>
								</div>
								<el-select class="district-select" v-model="listQuery.inspectRoundZipCode">
									<el-option v-for="(info, zip) in options.districtList" :key="zip" :label="info.name" :value="Number(zip)" />
								</el-select>
							</div>
						</div> -->
						
						
					<!-- </el-card> -->
				</span>
				
				
				<!-- NOTE: 選擇車號 -->
				<!-- <el-select v-if="listQuery.contractId != 99" v-model="listQuery.carId" placeholder="請選擇" style="width: 160px;"  @change="getCarList()">
					<el-option v-for="(text, id) in options.carId[listQuery.contractId]" :key="`car_${id}`" :label="text" :value="Number(id)" />
				</el-select>  -->

				<!-- NOTE: 種類先隱藏 -->
				<!-- <el-select v-model="listQuery.modeId" @change="getCarList()">
					<el-option v-for="(text, id) in options.modeId" :key="`model_${id}`" :label="text" :value="Number(id)" />
				</el-select> -->
				<!-- NOTE: 路線先隱藏 -->
				<!-- <el-select v-model="listQuery.inspectionId" placeholder="請選擇路線" @change="getCarInfo()">
					<el-option v-for="car in carList" :key="`car_${car.id}`" :label="`路線${car.id} (${car.carId})`" :value="Number(car.id)" />
				</el-select> -->

				
			</div>
		</div>
		<div id="map" ref="map" />
		<!-- 操作 -->
		<div class="action-box">
			<el-button class="btn-MapType" icon="el-icon-copy-document" size="small" :style="`color: ${options.mapList[mapType].color}`" @click="setMapType">{{ options.mapList[mapType].name }}</el-button>
		</div>
		<el-image-viewer v-if="showImgViewer" class="img-preview" :on-close="() => { showImgViewer = false; }" :url-list="imgUrls" />
	</div>
</template>

<script>
import { Loader } from "@googlemaps/js-api-loader";
import * as jsts from 'jsts/dist/jsts.min.js';
import moment from 'moment';
import { getInspectionList, getSpecInspection, getSpecInspectionTracks, getInspectionCase } from "@/api/car";
import { getInspectionRoute } from "@/api/inspection";
import ElImageViewer from 'element-ui/packages/image/src/image-viewer';

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
	components: { ElImageViewer },
	data() {
		return {
			admAuth: false,
			loading: false,
			showImgViewer: false,
			mediaAPIUrl: process.env.VUE_APP_MEDIA_API,
			mediaGCSUrl: process.env.VUE_APP_MEDIA_URL,
			showLayerAttach: false,
			autoRefresh: false,
			timer: null,
			mapType: 'roadmap',
			map: null,
			polyLines: [],
			markers: {
				start: null,
				end: null
			},
			imgUrls: [],
			infoWindow: null,
			caseInfo: [],
			activeVodName: "",
			timeTabId: 0,
			dateTimePickerVisible: false,
			pickerOptions: {
				firstDayOfWeek: 1,
				shortcuts: [
					{
						text: "前5",
						onClick(picker) {
							const date = moment().subtract(5, "d");
							picker.$emit("pick", date);
						}
					},
					{
						text: "前4",
						onClick(picker) {
							const date = moment().subtract(4, "d");
							picker.$emit("pick", date);
						}
					},
					{
						text: "前3",
						onClick(picker) {
							const date = moment().subtract(3, "d");
							picker.$emit("pick", date);
						}
					},
					{
						text: "前2",
						onClick(picker) {
							const date = moment().subtract(2, "d");
							picker.$emit("pick", date);
						}
					},
					{
						text: "前1",
						onClick(picker) {
							const date = moment().subtract(1, "d");
							picker.$emit("pick", date);
						}
					},
					{
						text: "今日",
						onClick(picker) {
							const date = moment();
							picker.$emit("pick", date);
						},
					},
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
				carInfo: {
					// id: "路線",
					pathId: "週期",
					carId: "車號",
					driverId: "駕駛",
					modeId: "巡查方式",
					createdAt: "開始時間"
				},
				caseInfo: {
					id: "缺失Id",
					caseName: "缺失類型",
					caseLevel: "缺失程度",
					millingLength: "預估長", 
					millingWidth: "預估寬",
					roadName: "地址",
					status: "狀態"
				}
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
					// 1003: {
					// 	name: "台北市(8-30)"
					// }
				},
				inspectRound: {
					// 0: "全部",
					1: "(1)",
					2: "(2)",
					3: "(3)",
					4: "(4)",
					5: "(5)",
					6: "(6)",
					7: "(7)"
				},
				modeId: {
					1: "手持巡查",
					2: "手持巡查(AI)",
					3: "車輛巡查",
					4: "車輛巡查(AI)"
				},
				contractId: {
					// 0: "超鉞",
					1: "一標",
					2: "二標",
					3: "三標",
					4: "四標",
					5: "五標",
					6: "六標"
				},
				contractIdToZipCode: {
					1: [103, 104],
					2: [105, 110],
					3: [106, 116],
					4: [114, 115],
					5: [111, 112],
					6: [100, 108]
				},
				carId: {
					0: {
						1: "TST-0000"
					},
					1: {
						// 1: "ATE-5102",
						1: "RDX-6883 (大同)",
						2: "RDQ-6279",
						// 3: "ATE-3192",
						3: "RDX-6881 (中山)",
					},
					2: {
						1: "ATE-3236 (松山)",
						2: "BFX-7552 (信義)",
					},
					3: {
						1: "BUX-0597 (中正)", //中正
						2: "RCX-7562 (萬華)", //萬華
					},
					4: {
						1: "ATE-3287 (內湖)",
						2: "ATE-3192 (南港)",
					},
					5: {
						1: "BPG-0891 (士林)",
						2: "BFX-7551 (北投)",
					},
					6: {
						1: "RCX-7561 (大安)", //大安
						2: "RCX-7560 (文山)", //文山
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
					}
				},
				caseMap: [
					{ caseName: ['坑洞'], showName: '坑洞', color: '#FF6347', icon: '/assets/icon/icon_red.png', order: 1 },
					{ caseName: ['龜裂'], showName: '龜裂', color: '#00FFFF', icon: '/assets/icon/icon_lightBlue.png', order: 2 },
					{ caseName: ['人手孔破損', '人孔'], showName: '人孔', color: '#90EE90', icon: '/assets/icon/icon_green.png', order: 3 },
					{ caseName: ['縱向與橫向裂縫', '縱橫裂縫'], showName: '裂縫', color: '#FFE4B5', icon: '/assets/icon/icon_orange.png', order: 4 },
				],
				caseLevelMap: {
					1: "輕",
					2: "中",
					3: "重"
				}
			},
			carList: [],
			carVodList: [],
			carInfo: [],
			carTracks: [],
			carTrackLastId: 0
		};
	},
	computed: {
		carId() {
			const carFilterList = this.carList.filter(car => car.id == this.listQuery.inspectionId);
			return carFilterList.length > 0 ? carFilterList[0].carId : "";
		}
	},
	created() {
		this.dataLayer = { route: {}, case: {} };
		this.admAuth = ['howard', 'ryan', 'lancelin'].includes(localStorage.username);
		if(this.admAuth) {
			this.options.contractId[0] = "超鉞";
			this.options.districtList[1003] = { name: "台北市(8-30)" };
		}

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
		// this.getCarList();
	},
	watch: {
		autoRefresh(newValue) {
			if(newValue) {
				if(this.markers[`end${this.listQuery.contractId}${this.listQuery.carId}`].getAnimation() == null)
					this.markers[`end${this.listQuery.contractId}${this.listQuery.carId}`].setAnimation(google.maps.Animation.BOUNCE);

				this.timer = setInterval(() => { 
					if(this.timeTabId == 0 && this.listQuery.inspectionId) this.getCarTrack(false);
					else this.autoRefresh = false;
				}, 20000);
			} else {
				clearInterval(this.timer);
				this.markers[`end${this.listQuery.contractId}${this.listQuery.carId}`].setAnimation(null);
			}
		}
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

			this.infoWindow = new google.maps.InfoWindow({ pixelOffset: new google.maps.Size(0, -10) });
			this.infoWindow.addListener('domready', () => {
				const infoScrnFullBtn = this.$el.querySelector("#map #info-scrn-full-btn");
				if(infoScrnFullBtn) {
					const clickHandle = infoScrnFullBtn.addEventListener("click", () => {
						// NOTE 因為http，圖片另開視窗
						// this.showImgViewer = true;
						window.open(this.imgUrls[0]);
						infoScrnFullBtn.removeEventListener("click", clickHandle);
					});
				}
			});

			// 建立marker
			for(let contractId of Object.keys(this.options.carId)) {
				for(let carId of Object.keys(this.options.carId[contractId])) {
					this.markers[`start${contractId}${carId}`] = new google.maps.Marker({
						map: this.map,
						icon: {
							url: "/assets/icon/icon_redDot.png",
							scaledSize: new google.maps.Size(10, 10)
						}
					});

					this.markers[`end${contractId}${carId}`] = new google.maps.Marker({
						map: this.map,
						label: {
							text: `${contractId}-${carId}`,
							color: 'white',
							fontSize: '12px'
						},
						icon: {
							url: "/assets/icon/truck.png",
							anchor: new google.maps.Point(14, 14),
							scaledSize: new google.maps.Size(28, 28),
							labelOrigin: new google.maps.Point(10, 11)
						}
					});
				}
			}

			// 巡視缺失
			this.dataLayer.case = new google.maps.Data({ map: this.map });

			this.dataLayer.case.addListener('click', (event) => {
				// console.log("click: ", event);
				this.showCaseContent(event.feature, event.latLng);
			});

			// 巡查路線(預定)
			this.dataLayer.route = new google.maps.Data({ map: this.map });
			this.dataLayer.route.setStyle({ 
				strokeColor: '#B0C4DE',
				strokeWeight: 3,
				strokeOpacity: 0.8,
				fillColor: '#B0C4DE',
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
				DAYBEFOREYEST: 2,
				DAYBEFOREYEST2: 3,
				DAYBEFOREYEST3: 4,
				DAYBEFOREYEST4: 5
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
				case DATE_OPTION.DAYBEFOREYEST2:
					this.searchDate = moment().subtract(3, "d");
					break;
				case DATE_OPTION.DAYBEFOREYEST3:
					this.searchDate = moment().subtract(4, "d");
					break;
				case DATE_OPTION.DAYBEFOREYEST4:
					this.searchDate = moment().subtract(5, "d");
					break;
			}
			this.getList();
		},
		setMapType() {
			const mapKeyList = Object.keys(this.options.mapList);
			let index = mapKeyList.indexOf(this.mapType);
			index = (index+1) % mapKeyList.length;
			this.mapType = mapKeyList[index];
			this.map.setMapTypeId(this.mapType);
		},
		getList() {
			if(this.listQuery.contractId == 99) this.getAllCarTrack();
			else this.getCarList();

			this.getCaseInfo();
		},
		getCarList() {
			this.loading = true;
			this.carList = [];
			this.carInfo = {};
			this.carVodList = [];
			this.carTracks = [];
			this.listQuery.inspectionId = "";
			this.polyLines.forEach(polyLine => polyLine.setMap(null));
			this.polyLines = [];
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
		getCarTrack(isFocusAll = true) {
			if (isFocusAll) this.dataLayer.route.revertStyle();
			const lastId = isFocusAll ? 0 : this.carTrackLastId;

			getSpecInspectionTracks(this.listQuery.inspectionId, { lastId }).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
					this.autoRefresh = false;
					this.loading = false;
				} else {
					let lastPt = [];
					if(this.carTracks.length != 0) {
						const lastTracks = this.carTracks[this.carTracks.length - 1];
						lastPt = [ lastTracks[0] ];
					}
					this.carTracks.push(response.data.list);
					this.carTrackLastId = this.carTracks.length == 0 ? 0 : this.carTracks[this.carTracks.length - 1][0].id;

					// 建立路線
					const paths = [ ...this.carTracks[this.carTracks.length - 1], ...lastPt ].map(point => ({ lat: point.lat, lng: point.long }));
					const polyLine = new google.maps.Polyline({
						path: paths,
						geodesic: true,
						strokeColor: "#6158EA",
						strokeOpacity: 0.8,
						strokeWeight: 8,
						map: this.map
					})
					this.polyLines.push(polyLine);

					if(isFocusAll) {
						const bounds = new google.maps.LatLngBounds();
						paths.forEach(position => bounds.extend(position));
						this.map.fitBounds(bounds);
					} this.map.panTo(paths[0]);

					if(isFocusAll) {
						this.markers[`start${this.listQuery.contractId}${this.listQuery.carId}`].setPosition(paths[paths.length-1]);
						this.markers[`start${this.listQuery.contractId}${this.listQuery.carId}`].setMap(this.map);
					}

					this.markers[`end${this.listQuery.contractId}${this.listQuery.carId}`].setPosition(paths[0]);
					this.markers[`end${this.listQuery.contractId}${this.listQuery.carId}`].setMap(this.map);

					if (this.showLayerAttach) this.intersectRoute();
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		getAllCarTrack() {
			this.loading = true;
			this.carList = [];
			this.carInfo = {};
			this.carVodList = [];
			this.carTracks = [];
			this.listQuery.inspectionId = "";
			this.polyLines.forEach(polyLine => polyLine.setMap(null));
			this.polyLines = [];
			for(const marker of Object.values(this.markers).filter(marker => marker != null)) marker.setMap(null);

			const date = moment(this.searchDate).format("YYYY-MM-DD");
			this.searchRange = date;

			for(let contractId of [1, 2, 3, 4, 5, 6]) {
				for(let carId of Object.keys(this.options.carId[contractId])) {
					this.loading = true;
					getInspectionList({
						contractId: contractId,
						modeId: this.listQuery.modeId,
						carId: carId,
						date: date
					}).then(response => {
						if (response.data.list.length != 0) {
							//NOTE: 因為一天只會有一次車巡，所以取第一筆
							const inspectionId = response.data.list[0].id;

							getSpecInspectionTracks(inspectionId).then(response => {
								if (response.data.list.length != 0) {
									this.carTracks.push(response.data.list);

									// 建立路線
									const paths = this.carTracks[this.carTracks.length - 1].map(point => ({ lat: point.lat, lng: point.long }));
									const polyLine = new google.maps.Polyline({
										path: paths,
										geodesic: true,
										strokeColor: "#6158EA",
										strokeOpacity: 0.8,
										strokeWeight: 8,
										map: this.map
									})
									this.polyLines.push(polyLine);

									this.markers[`start${contractId}${carId}`].setPosition(paths[paths.length-1]);
									this.markers[`start${contractId}${carId}`].setMap(this.map);
									this.markers[`end${contractId}${carId}`].setPosition(paths[0]);
									this.markers[`end${contractId}${carId}`].setMap(this.map);
								}
							}).catch(err => { this.loading = false; });
						}
					}).catch(err => console.log(err))
						.finally(() => this.loading = false);
				}
			}
		},
		getCarTrack() {
			this.loading = true;
			this.carList = [];
			this.carInfo = {};
			this.carVodList = [];
			this.carTracks = [];
			this.listQuery.inspectionId = "";
			this.polyLines.forEach(polyLine => polyLine.setMap(null));
			this.polyLines = [];
			for(const marker of Object.values(this.markers).filter(marker => marker != null)) marker.setMap(null);

			const date = moment(this.searchDate).format("YYYY-MM-DD");
			this.searchRange = date;

			for(let carId of Object.keys(this.options.carId[this.listQuery.contractId])) {
				this.loading = true;
				getInspectionList({
					contractId: this.listQuery.contractId,
					modeId: this.listQuery.modeId,
					carId: carId,
					date: date
				}).then(response => {
					if (response.data.list.length != 0) {
						//NOTE: 因為一天只會有一次車巡，所以取第一筆
						const inspectionId = response.data.list[0].id;

						getSpecInspectionTracks(inspectionId).then(response => {
							if (response.data.list.length != 0) {
								this.carTracks.push(response.data.list);

								// 建立路線
								const paths = this.carTracks[this.carTracks.length - 1].map(point => ({ lat: point.lat, lng: point.long }));
								const polyLine = new google.maps.Polyline({
									path: paths,
									geodesic: true,
									strokeColor: "#6158EA",
									strokeOpacity: 0.8,
									strokeWeight: 8,
									map: this.map
								})
								this.polyLines.push(polyLine);

								this.markers[`start${this.listQuery.contractId}${carId}`].setPosition(paths[paths.length-1]);
								this.markers[`start${this.listQuery.contractId}${carId}`].setMap(this.map);
								this.markers[`end${this.listQuery.contractId}${carId}`].setPosition(paths[0]);
								this.markers[`end${this.listQuery.contractId}${carId}`].setMap(this.map);
							}
						}).catch(err => { this.loading = false; });
					}
				}).catch(err => console.log(err))
					.finally(() => this.loading = false);
			}
		},
		getCaseInfo() {
			const timeStart = moment(this.searchDate).format("YYYY-MM-DD");
			const timeEnd = moment(this.searchDate).add(1, 'd').format("YYYY-MM-DD");
			getInspectionCase({ contractId: this.listQuery.contractId, timeStart, timeEnd }).then(response => {
				const caseList = response.data.list.map(caseSpec => {
					const codeArr = caseSpec.caseType.match(/&#(\d+);/g) || [];
					if(codeArr.length > 0) {
						caseSpec.caseType = String.fromCharCode(...codeArr.map(l => Number(l.replace(/[&#;]/g, ''))));
					}

					const codeArr2 = caseSpec.imgfile.match(/&#(\d+);/g) || [];
						for(const code of codeArr2) {
							caseSpec.imgfile = caseSpec.imgfile.replace(code, String.fromCharCode(Number(code.replace(/[&#;]/g, ''))));
						}
					caseSpec.imgUrl =  /^https:\/\//.test(caseSpec.imgfile) ? caseSpec.imgfile : `http://center.bim-group.com${caseSpec.imgfile}`;
					return caseSpec
				});

				this.caseInfo = caseList.reduce((acc, cur)=> {
					const accFilter = acc.filter(caseSpec => caseSpec.caseName.includes(cur.caseType) || (caseSpec.showName && cur.caseType.includes(caseSpec.showName)));
					if(accFilter.length == 0) {
						const caseFilter = this.options.caseMap.filter(caseSpec => caseSpec.caseName.includes(cur.caseType) || (caseSpec.showName && cur.caseType.includes(caseSpec.showName)));
						acc.push({ 
							caseName: caseFilter.length == 0 ? [] : caseFilter[0].caseName,
							showName: caseFilter.length == 0 || !caseFilter[0].showName ? '' : caseFilter[0].showName,
							color: caseFilter.length == 0 ? '#1E90FF' : caseFilter[0].color,
							icon: caseFilter.length == 0 ? '/assets/icon/icon_blue.png' : caseFilter[0].icon,
							order: caseFilter.length == 0 ? 5 : caseFilter[0].order,
							active: true,
							total: 1 
						});
					} else accFilter[0].total++;

					return acc;
				}, []);

				this.caseInfo.sort((a, b) => a.order - b.order);

				this.geoJSON = {
					"type": "FeatureCollection",
					"name": "caseJSON",
					"features": []
				};

				for (const caseSpec of caseList) {
					let feature = {
						"type": "Feature",
						"properties": {
							"id": caseSpec.serialno,
							"roadName": caseSpec.casename == '0' ? '' : caseSpec.casename,
							"caseName": caseSpec.caseType,
							"caseLevel": caseSpec.broketype ? this.options.caseLevelMap[caseSpec.broketype] : '',
							"millingLength": caseSpec.elength || 0, 
							"millingWidth": caseSpec.blength || 0,
							"status": caseSpec.reccontrol == 2 ? '已分案' : '未分案',
							"imgUrl": caseSpec.imgUrl
						},
						"geometry": {
							"type": "POINT",
							"coordinates": [ Number(caseSpec.yy), Number(caseSpec.xx) ]
						}
					};
					this.geoJSON.features.push(feature);
				}

				this.setCaseLayer(this.geoJSON);
			}).catch(err => console.log(err))
		},
		setCaseLayer(geoJSON) {
			this.dataLayer.case.forEach(feature => this.dataLayer.case.remove(feature));
			this.dataLayer.case.addGeoJson(geoJSON);
			this.dataLayer.case.setStyle(feature => {
				const caseName = feature.getProperty("caseName");
				const caseFilter = this.options.caseMap.filter(caseSpec => caseSpec.caseName.includes(caseName));

				return { 
					icon: { 
						url: caseFilter.length == 0 ? '/assets/icon/icon_blue.png' : caseFilter[0].icon,
						scaledSize: new google.maps.Size(30, 30),
					}
				};
			})
		},
		caseFilter() { 
			let geoJSONFilter = JSON.parse(JSON.stringify(this.geoJSON));
			geoJSONFilter.features = geoJSONFilter.features.filter(feature => {
				const selectCaseList = this.caseInfo.filter(caseSpec => caseSpec.active).map(caseSpec => caseSpec.caseName).flat();
				return selectCaseList.includes(feature.properties.caseName)
			})

			this.setCaseLayer(geoJSONFilter);
		},
		showCaseContent(props, position) {
			let imgUrl = props.getProperty('imgUrl');
			const codeArr = imgUrl.match(/&#(\d+);/g) || [];
			const codeConvert = codeArr.map(l => String.fromCharCode(Number(l.replace(/[&#;]/g, ''))));
			for(const i in codeArr) imgUrl = imgUrl.replace(codeArr[i], codeConvert[i]);
			this.imgUrls = [ imgUrl ];

			let contentText = `<div style="width: 400px;">`;
			for(const key in this.headers.caseInfo) {
				if(props.getProperty(key)) {
					const prop = props.getProperty(key);
					contentText += `<div class="el-row" style="margin-bottom: 4px">`;
					contentText += `<div class="el-col el-col-8" style="padding-left: 5px; font-size: 18px; line-height: 18px;">${this.headers.caseInfo[key]}</div>`;
					contentText += `<div class="el-col el-col-16" style="font-size: 18px; line-height: 18px;">${prop}</div>`;
					contentText += `</div>`;
				}
			}
			contentText += `<img src="${imgUrl}" class="img" onerror="this.className='img hide-img'">`;
			contentText += `<button type="button" id="info-scrn-full-btn" class="info-btn scrn-full el-button el-button--default" style="height: 30px; width: 30px;"><i class="el-icon-full-screen btn-text"></i></button></img>`;
			contentText += `</div>`;
			// console.log(contentText);
			this.infoWindow.setContent(contentText);
			this.infoWindow.setOptions({ pixelOffset: new google.maps.Size(0, -10)});
			this.infoWindow.setPosition(position);

			this.infoWindow.open(this.map);
		},
		async getRouteList() {
			this.loading = true;
			this.dataLayer.route.forEach(feature => this.dataLayer.route.remove(feature));
			
			this.blockList = [];
			
			// 因為一個標 包含2個行政區 所以呼叫2次API
			for (let i = 0; i < 2; i++) {
				await getInspectionRoute({
					zipCode: this.options.contractIdToZipCode[this.listQuery.contractId][i],
					inspectRound: this.listQuery.inspectRound,
					isCar: true
				}).then(response => {
					if (response.data.blockList.length == 0 && response.data.routeList.length == 0) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
					} else {
						// this.blockList = response.data.blockList;
						this.blockList = this.blockList.concat(response.data.blockList);

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
			}
		},
		// 點擊週期可以同時載入和比對
		async handleButton(id) {
			this.listQuery.inspectRound = id;
			await this.getRouteList();
			await this.intersectRoute();
		},
		clearRouteLayer() {
			this.dataLayer.route.forEach(feature => this.dataLayer.route.remove(feature));
			this.showLayerAttach = false;
		},
		intersectRoute() {
			this.dataLayer.route.revertStyle();
			const jstsRoutePoints = this.carTracks.flat(1).map(point => this.createJstsGeometry([[ point.long, point.lat ]]));
			// console.log(jstsRoutePoints.length);
			this.dataLayer.route.forEach(feature => {
				feature.toGeoJson(json => {
					const jstsBlockPolygon = this.createJstsGeometry(json.geometry.coordinates.flat(2));
					for(let i=0; i <= jstsRoutePoints.length - 1; i++) {
						// console.log(i);
						if(i == 0) this.loading = true;
						if(jstsBlockPolygon.contains(jstsRoutePoints[i])) {
							// console.log("BINGO: ", i);
							this.dataLayer.route.overrideStyle(feature, { strokeColor: '#4169E1', fillColor: "#4169E1" });
							this.loading = false;
							break;
						} else if(i == jstsRoutePoints.length - 1) {
							this.loading = false;
							this.dataLayer.route.overrideStyle(feature, { strokeColor: '#DC143C', fillColor: "#DC143C" });
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
	.info-box
		position: absolute
		top: 18px
		left: 248px
		background-color: rgba(white, 0.1)
		border: none
		z-index: 1
		.el-card__body
			padding: 2px
			display: flex
			.color-box
				line-height: 30px
				height: 30px
				width: 120px
				margin-bottom: 0px
				margin-left: 5px
	.action-box
		.btn-MapType
			position: absolute
			top: 24px
			right: 24px
			background-color: rgba(white, 0.8)
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