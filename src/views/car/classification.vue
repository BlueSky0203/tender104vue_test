<template>
	<div class="case-classification" v-loading="loading"> 
		<div class="header-bar">
			<h2 class="route-title">巡視分案
				<span v-if="caseInfo.length != 0" class="route-info">{{ searchRange }}</span>
			</h2>
			<el-card v-if="caseInfo.length != 0" class="info-box top" shadow="never">
				<el-row v-for="(info, index) in caseInfo" :key="`caseInfo_${info.showName}_${index}`" class="color-box" type="flex" :style="`background-color: ${info.active ? info.color : '#eee'}; cursor: pointer`" @click.native="info.active = !info.active; caseFilter();">
					<el-col :span="5"><el-image :src="info.icon" fit="scale-down" style="height: 30px" /></el-col>
					<el-col :span="12" style="padding: 0 5px">{{ info.showName || info.caseName }}</el-col>
					<el-col :span="5">
						<span>{{ info.total }}</span>
					</el-col>
				</el-row>
			</el-card>
			<div class="filter-container">
				<el-select v-model="listQuery.contractId" placeholder="請選擇" style="width: 100px;">
					<!-- <el-option label="全部" :value="99" /> -->
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
					<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList()">搜尋</el-button>
				</span>
			</div>
		</div>
		<div id="map" ref="map" />
		<!-- 操作 -->
		<div class="action-box">
			<el-button class="btn-MapType" icon="el-icon-copy-document" size="small" :style="`color: ${options.mapList[mapType].color}`" @click="setMapType">{{ options.mapList[mapType].name }}</el-button>
		</div>

		<transition name="el-fade-in">
			<el-card v-if="Object.keys(rowActive).length > 0" class="info-box right">
				<el-form :model="rowActive" label-width="70px" size="small">
					<el-form-item prop="id" label="缺失Id" style="margin-bottom: 0">
						<span>{{ rowActive.id }}</span>
					</el-form-item>
					<el-form-item prop="distressType" label="缺失類型" style="margin-bottom: 0">
						<el-select v-model="rowActive.distressType" size="mini">
							<el-option v-for="caseType in options.caseTypeMap" :key="caseType.id" :label="caseType.caseName[0]" :value="Number(caseType.id)" />
						</el-select>
					</el-form-item>
					<el-form-item prop="distressLevel" label="缺失程度">
						<el-select v-model="rowActive.distressLevel" size="mini">
							<el-option v-for="(name, level) in options.caseLevelMap" :key="level" :label="name" :value="Number(level)" />
						</el-select>
					</el-form-item>
					<el-form-item prop="millingLength" label="預估長" style="margin-bottom: 0">
						<el-input v-model="rowActive.millingLength" size="mini" style="width: 130px" @change="calArea()" />
					</el-form-item>
					<el-form-item prop="millingWidth" label="預估寬">
						<el-input v-model="rowActive.millingWidth" size="mini" style="width: 130px" @change="calArea()" />
					</el-form-item>
					<el-form-item prop="zipCode" label="地區" style="margin-bottom: 0">
						<el-select v-model="rowActive.zipCode" size="mini">
							<el-option v-for="(name, code) in options.districtList[contractIdNow]" :key="code" :label="name" :value="Number(code)" />
						</el-select>
					</el-form-item>
					<el-form-item prop="place" label="地址" style="margin-bottom: 0">
						<el-input v-model="rowActive.place" type="textarea" :rows="2" />
						<div slot="label">
							<div style="height: 24px; line-height: 24px; margin: -3px 2px -5px 0">地址</div>
							<el-button type="success" size="mini" style="padding: 5px" :loading="isGetAddress" @click="getAddress()">填入</el-button>
						</div>
					</el-form-item>
					<el-form-item prop="position" label="位置" style="margin-bottom: 0">
						<span>({{ rowActive.position.lng }}, {{ rowActive.position.lat }})</span>
					</el-form-item>
					<el-form-item prop="roadDir" label="車道" style="margin-bottom: 0">
						<el-input class="road-dir" type="number" v-model="rowActive.lane" size="mini" :min="1" :max="5" @blur="changeValue(rowActive)">
							<el-select slot="prepend" v-model="rowActive.direction" popper-class="type-select" size="mini">
								<el-option v-for="(name, id) in options.roadDir" :key="id" :label="name" :value="Number(id)" />
							</el-select>
						</el-input>
					</el-form-item>
					<el-form-item label="照片">
						<el-link :href="rowActive.imgUrl" :underline="false" target="_blank">
							<el-image style="width: 100%;" :src="rowActive.imgUrl" fit="contain">
								<el-button slot="error">另開視窗</el-button>
							</el-image>
						</el-link>
					</el-form-item>
				</el-form>
				<el-button-group class="btn-action-group">
					<el-button type="primary" @click="setCase()" :loading="loading">成案</el-button>
					<el-button type="danger" @click="delCase()" :loading="loading">刪除</el-button>
					<el-button type="info" @click="cancelClick()">取消</el-button>
				</el-button-group>
			</el-card>
		</transition>
		<el-image-viewer v-if="showImgViewer" class="img-preview" :on-close="() => { showImgViewer = false; }" :url-list="imgUrls" />
	</div>
</template>

<script>
import { Loader } from "@googlemaps/js-api-loader";
import moment from 'moment';
import { parseXml, xml2json } from '../../utils/xml2json';
import { getInspectionCase, setInspectionCase, delInspectionCase } from "@/api/car";
import { getAddress } from "@/api/tool";
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

// TODO: apiKey先關閉
if(!sessionStorage.devMode && process.env.VUE_APP_MAP_KEY != undefined) loaderOpt.apiKey = process.env.VUE_APP_MAP_KEY;
const loader = new Loader(loaderOpt);

export default {
	name: "caseClassification",
	components: { ElImageViewer },
	data() {
		return {
			loading: false,
			isGetAddress: false,
			showImgViewer: false,
			showLayerAttach: false,
			timer: null,
			mapType: 'hybrid',
			map: null,
			polyLines: [],
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
			rowActive: { },
			contractIdNow: 1,
			listQuery: {
				contractId: 1
			},
			headers: {
				caseInfo: {
					id: "缺失Id",
					caseType: "缺失類型",
					caseLevel: "缺失程度",
					elength: "預估長", 
					blength: "預估寬",
					casename: "地址",
					status: "狀態"
				}
			},
			options: {
				districtList: {
					1: {
						103: "大同區",
						104: "中山區"
					},
					2: {
						105: "松山區",
						110: "信義區"
					},
					3: {
						100: "中正區",
						108: "萬華區"
					},
					4: {
						114: "內湖區",
						115: "南港區",
					},
					5: {
						111: "士林區",
						112: "北投區"
					},
					6: {
						106: "大安區",
						116: "文山區"
					}
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
				caseTypeMap: [
					{ id: 15, caseName: ['坑洞'], showName: '坑洞', color: '#FF6347', icon: '/assets/icon/icon_red.png', order: 1 },
					{ id: 16, caseName: ['龜裂'], showName: '龜裂', color: '#00FFFF', icon: '/assets/icon/icon_lightBlue.png', order: 2 },
					{ id: 34, caseName: ['人手孔破損', '人孔'], showName: '人孔', color: '#90EE90', icon: '/assets/icon/icon_green.png', order: 3 },
					{ id: 29, caseName: ['縱向與橫向裂縫', '縱橫裂縫'], showName: '裂縫', color: '#FFE4B5', icon: '/assets/icon/icon_orange.png', order: 4 },
				],
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
			}
		};
	},
	computed: { },
	created() {
		this.markers = [];

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
	mounted() { },
	watch: { },
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
				mapTypeId: "hybrid",
				fullscreenControl: false,
				mapTypeControl: false,
				// streetViewControl: false,
				rotateControl: false,
				tilt: 45,
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

			this.geocoder = new google.maps.Geocoder();
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
			this.getList();
		},
		setMapType() {
			const mapKeyList = Object.keys(this.options.mapList);
			let index = mapKeyList.indexOf(this.mapType);
			index = (index+1) % mapKeyList.length;
			this.mapType = mapKeyList[index];
			this.map.setMapTypeId(this.mapType);
		},
		changeValue(caseInfo) {
			if(caseInfo.lane) caseInfo.lane = caseInfo.lane.replace(/[^\d]/g,''); 
			if(caseInfo.lane <= 1) caseInfo.lane = 1; 
			if(caseInfo.lane >= 5) caseInfo.lane = 5; 
		},
		getList() {
			this.caseList = [];
			this.rowActive = {};
			this.caseInfo = [];
			this.infoWindow.close();
			this.markers.forEach(marker => marker.setMap(null));
			this.markers = [];

			const timeStart = moment(this.searchDate).format("YYYY-MM-DD");
			const timeEnd = moment(this.searchDate).add(1, 'd').format("YYYY-MM-DD");
			this.searchRange = timeStart;

			getInspectionCase({ contractId: this.listQuery.contractId, timeStart, timeEnd }).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
					this.loading = false;
				} else {
					this.contractIdNow = this.listQuery.contractId;
					this.caseList = response.data.list.map(caseSpec => {
						caseSpec.caseLevel = caseSpec.broketype ? this.options.caseLevelMap[caseSpec.broketype] : '';
						caseSpec.status = caseSpec.reccontrol == 2 ? '已分案' : '未分案';

						const codeArr1 = caseSpec.caseType.match(/&#(\d+);/g) || [];
						if(codeArr1.length > 0) {
							caseSpec.caseType = String.fromCharCode(...codeArr1.map(l => Number(l.replace(/[&#;]/g, ''))));
						}

						const codeArr2 = caseSpec.imgfile.match(/&#(\d+);/g) || [];
						for(const code of codeArr2) {
							caseSpec.imgfile = caseSpec.imgfile.replace(code, String.fromCharCode(Number(code.replace(/[&#;]/g, ''))));
						}
						caseSpec.imgUrl =  /^https:\/\//.test(caseSpec.imgfile) ? caseSpec.imgfile : `http://center.bim-group.com${caseSpec.imgfile}`;
						return caseSpec
					});

					this.caseInfo = this.caseList.reduce((acc, cur)=> {
						const accFilter = acc.filter(caseSpec => caseSpec.caseName.includes(cur.caseType) || (caseSpec.showName && cur.caseType.includes(caseSpec.showName)));
						if(accFilter.length == 0) {
							const caseFilter = this.options.caseTypeMap.filter(caseSpec => caseSpec.caseName.includes(cur.caseType) || (caseSpec.showName && cur.caseType.includes(caseSpec.showName)));
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
					this.setCaseMarker(this.caseList);
				}
			}).catch(err => console.log(err))
		},
		setCaseMarker(caseList) {
			this.markers.forEach(marker => marker.setMap(null));
			this.markers = [];
			const bounds = new google.maps.LatLngBounds();

			for (const caseSpec of caseList) {
				const caseType = caseSpec.caseType;
				const caseFilter = this.options.caseTypeMap.filter(caseSpec => caseSpec.caseName.includes(caseType));

				const marker = new google.maps.Marker({
					position: { lat: Number(caseSpec.xx), lng: Number(caseSpec.yy) },
					icon: { 
						url: caseFilter.length == 0 ? '/assets/icon/icon_blue.png' : caseFilter[0].icon,
						scaledSize: new google.maps.Size(30, 30),
					},
					// draggable: caseSpec.reccontrol == '1',
					caseType,
					position_ori: { lat: Number(caseSpec.xx), lng: Number(caseSpec.yy) },
					map: this.map
				});

				marker.addListener('click', (event) => {
					this.cancelClick();

					if(caseSpec.reccontrol != 2) {
						marker.setIcon({
							url: '/assets/icon/icon_case_H.png',
							scaledSize: new google.maps.Size(35, 35)
						});
						marker.setDraggable(true);

						this.$nextTick(() => {
							const caseType = caseSpec.caseType;
							const caseFilter = this.options.caseTypeMap.filter(caseSpec => caseSpec.caseName.includes(caseType));

							this.rowActive = {
								id: caseSpec.serialno,
								distressType: caseFilter.length != 0 ? caseFilter[0].id : 15,
								distressLevel: caseSpec.caseLevel || 1,
								millingLength: caseSpec.elength || 0,
								millingWidth: caseSpec.blength || 0,
								place: caseSpec.casename == '0' ? '' : caseSpec.casename,
								roadDir: caseSpec.lane || 1,
								direction: caseSpec.direction || 1,
								imgUrl: caseSpec.imgUrl,
								position: event.latLng.toJSON(),
								position_ori: event.latLng.toJSON()
							}
						})	
					} else this.showCaseContent(caseSpec, event.latLng);
				})

				marker.addListener('dragend', (event) => {
					// console.log(event.latLng.toJSON());
					this.rowActive.position = event.latLng.toJSON();
				})

				this.markers.push(marker);
				bounds.extend({lat: Number(caseSpec.xx), lng: Number(caseSpec.yy)});
			}

			if(!bounds.isEmpty()) this.map.fitBounds(bounds);
		},
		getAddress() {
			this.isGetAddress = true;

			getAddress(this.rowActive.position).then(res => {
				const resJson = JSON.parse(xml2json(parseXml(res.data), ''));
				const addressJson = JSON.parse(resJson.string['#text']);
				// console.log(addressJson);

				if(addressJson.AddressList.length > 0) this.rowActive.place = addressJson.AddressList[0].FULL_ADDR;
				else {
					this.$message({
						message: "查無地址",
						type: "error",
					});
				}
				this.isGetAddress = false;
			}).catch(err => {
				console.log(err);

				// google Map 查詢地址
				this.geocoder.geocode({ location: this.rowActive.position }).then(res => {
					if (res.results[0]) this.rowActive.place = res.results[0].formatted_address;
					else {
						this.$message({
							message: "查無地址",
							type: "error",
						});
					}
					this.isGetAddress = false;
				}).catch(err => {
					console.log(err);
					this.isGetAddress = false;
				});
			});
		},
		caseFilter() { 
			let caseListFilter = JSON.parse(JSON.stringify(this.caseList));
			caseListFilter = caseListFilter.filter(caseSpec => {
				const selectCaseList = this.caseInfo.filter(caseSpec => caseSpec.active).map(caseSpec => caseSpec.caseName).flat();
				return selectCaseList.includes(caseSpec.caseType)
			})

			this.setCaseMarker(caseListFilter);
		},
		showCaseContent(caseSpec, position) {
			let imgUrl = caseSpec.imgUrl;
			const codeArr = imgUrl.match(/&#(\d+);/g) || [];
			const codeConvert = codeArr.map(l => String.fromCharCode(Number(l.replace(/[&#;]/g, ''))));
			for(const i in codeArr) imgUrl = imgUrl.replace(codeArr[i], codeConvert[i]);
			this.imgUrls = [ imgUrl ];

			let contentText = `<div style="width: 400px;">`;
			for(const key in this.headers.caseInfo) {
				if(caseSpec[key]) {
					const prop = caseSpec[key];
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
		cancelClick() {
			this.rowActive = {};
			this.infoWindow.close();

			this.markers.forEach(marker => {
				marker.setDraggable(false);
				marker.setPosition(marker.position_ori);

				const caseFilter = this.options.caseTypeMap.filter(caseSpec => caseSpec.caseName.includes(marker.caseType));

				marker.setIcon({
					url: caseFilter.length == 0 ? '/assets/icon/icon_blue.png' : caseFilter[0].icon,
					scaledSize: new google.maps.Size(30, 30),
				});
			});
		},
		setCase() {
			this.loading = true;
			setInspectionCase({
				contractId: this.contractIdNow,
				zipCode: this.rowActive.zipCode,
				caseId: this.rowActive.id,
				reportTime: moment(this.rowActive.reportTime).format("YYYY-MM-DD HH:mm:ss"),
				distressType: this.rowActive.distressType,
				distressLevel: this.rowActive.distressLevel,
				millingLength: Number(this.rowActive.millingLength),
				millingWidth: Number(this.rowActive.millingWidth),
				millingArea: Number(this.rowActive.millingArea),
				place: this.rowActive.place,
				position: this.rowActive.position,
				direction: this.rowActive.direction,
				lane: Number(this.rowActive.lane),
				imgUrl: this.rowActive.imgUrl
			}).then(response => {
				this.$message({
					message: "分案成功",
					type: "success",
				});
				this.getList();
			}).catch(err => {
				console.log(err);
				this.$message({
					message: "分案失敗",
					type: "error",
				});
			}).finally(() => this.loading = false);
		},
		delCase() {
			this.loading = true;
			delInspectionCase({ caseId: this.rowActive.id }).then(response => {
				this.$message({
					message: "刪除成功",
					type: "success",
				});
				this.getList();
			}).catch(err => {
				console.log(err);
				this.$message({
					message: "刪除失敗",
					type: "error",
				});
			}).finally(() => this.loading = false)
		},
		calArea() {
			this.rowActive.millingArea = Math.round(this.rowActive.millingLength * this.rowActive.millingWidth * 100 ) / 100;
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
.case-classification
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
		border: none
		z-index: 1
		&.top
			top: 18px
			left: 248px
			background-color: rgba(white, 0.1)
			.el-card__body
				padding: 2px
		&.right
			width: 280px
			top: 72px
			right: 15px
			background-color: rgba(white, 0.6)
			.el-card__body
				padding: 8px
				flex-direction: column
				.el-form-item
					margin-bottom: 10px
					.el-form-item__label
						line-height: auto
					.road-dir .el-select
						width: 80px
		.el-card__body
			display: flex
			.color-box
				line-height: 30px
				height: 30px
				width: 120px
				margin-bottom: 0px
				margin-left: 5px
			.btn-action-group
				display: flex
				width: 100%
				padding: 0
				.el-button
					flex: 1
					padding: 10px 0
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
</style>