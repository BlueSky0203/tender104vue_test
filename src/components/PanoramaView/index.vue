<template>
	<div ref="panoramaView" class="panorama-view">
		<div id="panorama">
			<div v-if="localEnv && panorama" style="position: absolute; top: 0; left: 0; z-index:99; background-color: rgba(255, 255, 255, 0.6); padding: 5px 10px">
				<el-input
					class="searchBox"
					v-model="testQuery.sceneId"
					placeholder="sceneId"
					style="display: inline-block; width: 180px"
					@change="showPanoramaLayer(testQuery.sceneId)"
				/>
				<el-checkbox v-model="isAutoMove" @change="showPanoramaLayer(panorama.getScene())">自動前進</el-checkbox>
				<el-checkbox v-model="isAutoRotate" @change="setAutoRotate()">自動旋轉</el-checkbox>
				<div> {{ panorama.getScene() }}</div>
				<div>{{ panoramaTestInfo }} </div>
				<div>{{ panoramaTestInfo.position }}</div>
			</div>

			<el-card v-if="hotSpotIdList.dot.length > 1 || isReview" class="info-box right">
				<el-form :model="caseInfo" label-width="70px" size="small">
					<el-form-item prop="trackingId" label="追蹤Id" style="margin-bottom: 0">
						<span v-if="isReview">{{ caseInfo.trackingId }}</span>
						<el-input v-else v-model="caseInfo.trackingId" size="mini" style="width: 130px" @change="trackingCase()" />
					</el-form-item>
					<el-form-item prop="dateReport" label="通報時間">
						<span v-if="isReview">{{ formatTime(caseInfo.dateReport) }}</span>
						<el-date-picker
							v-else
							v-model="caseInfo.dateReport"
							type="datetime"
							placeholder="日期"
							:clearable="false"
							size="mini"
						/>
					</el-form-item>
					<el-form-item prop="type" label="缺失類型" style="margin-bottom: 5px">
						<span v-if="isReview">{{ options.caseTypeMap[caseInfo.distressType] }}</span>
						<el-select v-else v-model="caseInfo.distressType" size="mini" @change="calcCaseInfo">
							<el-option v-for="key in options.caseTypeMapOrder" :key="key" :label="options.caseTypeMap[key]" :value="Number(key)" />
						</el-select>
					</el-form-item>
					<el-form-item prop="level" label="缺失程度">
						<span v-if="isReview">{{ options.caseLevelMap[caseInfo.distressLevel] }}</span>
						<el-select v-else v-model="caseInfo.distressLevel" size="mini">
							<el-option v-for="(name, level) in options.caseLevelMap" :key="level" :label="name" :value="Number(level)" />
						</el-select>
					</el-form-item>
					<el-form-item prop="millingLength" label="預估長" style="margin-bottom: 0">
						<span v-if="isReview">{{ caseInfo.millingLength }}</span>
						<el-input v-else v-model="caseInfo.millingLength" size="mini" style="width: 130px" @change="calArea()" />
					</el-form-item>
					<el-form-item prop="millingWidth" label="預估寬" style="margin-bottom: 0">
						<span v-if="isReview">{{ caseInfo.millingWidth }}</span>
						<el-input v-else v-model="caseInfo.millingWidth" size="mini" style="width: 130px" @change="calArea()" />
					</el-form-item>
					<el-form-item prop="millingArea" label="預估面積">
						<span v-if="isReview">{{ caseInfo.millingArea }}</span>
						<el-input v-else v-model="caseInfo.millingArea" size="mini" style="width: 130px" />
					</el-form-item>
					<el-form-item prop="address" label="地址" style="margin-bottom: 5px">
						<span v-if="isReview">{{ caseInfo.place }}</span>
						<el-input v-else v-model="caseInfo.place" type="textarea" :rows="2" />
						<div v-if="!isReview" slot="label">
							<div style="height: 24px; line-height: 24px; margin: -3px 2px -5px 0">地址</div>
							<el-button type="success" size="mini" style="padding: 5px" :loading="isGetAddress" @click="getAddress()">填入</el-button>
						</div>
					</el-form-item>
					<el-form-item prop="roadDir" label="車道">
						<span v-if="isReview">{{ options.roadDir[caseInfo.direction] }} - {{ caseInfo.lane }}</span>
						<el-input v-else class="road-dir" v-model="caseInfo.lane" size="mini">
							<el-select slot="prepend" v-model="caseInfo.direction" popper-class="type-select" size="mini">
								<el-option v-for="(name, id) in options.roadDir" :key="id" :label="name" :value="Number(id)" />
							</el-select>
						</el-input>
					</el-form-item>
					<el-form-item v-for="(imgName, imgType) in options.imgTypeMap" :key="imgType" :prop="imgType" :label="imgName" style="margin-bottom: 0">
						<el-row :gutter="15" style="position: relative">
							<el-col :span="10">
								<el-popover v-if="caseInfo[imgType].length > 0" popper-class="imgHover" placement="left" trigger="hover">
									<el-image style="width: 100%; height: 100%" :src="caseInfo[imgType]" fit="contain" />
									<el-image slot="reference" style="width: 100px; height: 100px" :src="caseInfo[imgType]" fit="contain" @click="$emit('setCaseImgViewer', { imgUrls: [ caseInfo[imgType] ], isOpen: true })" />
								</el-popover>
							</el-col>
							<el-col v-if="!isReview" class="btn-img-action" :span="8">
								<el-button type="success" size="mini" @click="screenshot(imgType)">截圖</el-button>
								<el-button v-if="caseInfo[imgType].length > 0" type="danger" size="mini" @click="caseInfo[imgType] = ''">刪除</el-button>
							</el-col>
						</el-row>
					</el-form-item>
				</el-form>
				<el-button-group class="btn-action-group">
					<el-button v-if="!isReview" :type="caseInfo.isPrev ? 'primary' : 'success'" @click="uploadCase()" :loading="isUpload">{{ caseInfo.isPrev ? '追蹤' : '新增' }}</el-button>
					<el-button type="danger" @click="clearAll(); resetCaseHotSpot();" :disabled="isUpload">{{ isReview ? '關閉' : '清除' }}</el-button>
				</el-button-group>
			</el-card>

			<el-button class="btn-forward" size="mini" round plain @click="forwardPanorama"><i class="el-icon-caret-top" /></el-button>
			<el-button class="btn-backward" size="mini" round plain @click="backwardPanorama"><i class="el-icon-caret-bottom" /></el-button>
		</div>
	</div>
</template>

<script>
import { Loader } from "@googlemaps/js-api-loader";
import moment from "moment";
import html2canvas from 'html2canvas';
import { parseXml, xml2json } from '../../utils/xml2json';
import { getAddress } from "@/api/tool";
const { calcDistance, calArea } = require('@/utils/geo-tools');
const cameraHeight = 2.25; // 攝影機高度

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
	name: "panoramaView",
	props: {
		loading: {
			required: true,
			type: Boolean
		},
		isUpload: {
			required: true,
			type: Boolean
		},
		listQuery: {
			type: Object,
			required: true
		},
		panoramaInfo: {
			type: Object,
			required: true
		},
		options: {
			type: Object,
			required: true
		},
		caseGeoJson: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			localEnv: process.env.NODE_ENV == 'development',
			isGetAddress: false,
			isAutoMove: false,
			isAutoRotate: false,
			isReview: false,
			isSticky: false,
			panorama: null,
			prevSceneId: [],
			hotSpotId: 0,
			hotSpotIdList: {
				dot: [],
				case: []
			},
			imageSize: {
				width: 7689,
				height: 3840
			},
			testQuery: {
				sceneId: ""
			},
			panoramaTestInfo: {
				Pitch: 0,
				Yaw: 0,
				Hfov: 0,
				position: {}
			},
			caseInfo: {
				dateReport: moment().startOf("d"),
				trackingId: 0,
				distressType: "",
				distressLevel: "",
				millingLength: 0,
				millingWidth: 0,
				millingArea: 0,
				place: "",
				direction: 1,
				lane: 1,
				imgZoomIn: "",
				imgZoomOut: ""
			}
		}
	},
	computed: {
		panoramaInfoProps: {
			get() {
				return this.panoramaInfo
			},
			set(val) {
				this.$emit('update:panoramaInfo', val)
			}
		}
	},
	created() { },
	mounted() {
		// google Map 查詢地址
		loader.load().then(() => {
			this.geocoder = new google.maps.Geocoder();
		}).catch(err => console.log("err: ", err));

		// init panorama
		// console.log("panorama_mounted");
		this.panorama = pannellum.viewer("panorama", { scenes: {}, keyboardZoom: false, hotSpotDebug: false });
		this.panorama.on("load", async () => {
			this.panorama.resize();
			this.setAutoRotate();
			this.resetCaseHotSpot();

			const delay = this.isAutoRotate ? 8000 : 3000;
			if(this.isAutoMove) {
				await new Promise(r => setTimeout(r, delay));
				this.panorama.stopAutoRotate();
				const lineInfoList = this.panoramaInfoProps.data.flat();
				const sceneId = this.panorama.getScene();
				const index = lineInfoList.map((el, index) => { if(el.fileName == sceneId) return index }).filter(el => el != undefined)[0];
				this.showPanoramaLayer(lineInfoList[index+1].fileName);
			}
		});

		this.panorama.on('mousedown', (evt) => {
			this.$emit('setHeading', this.panorama.getNorthOffset()+this.panorama.getYaw());
			if(!evt.shiftKey) return;

			// coords[0] is pitch, coords[1] is yaw
			const [ pitch , yaw ] = this.panorama.mouseEventToCoords(evt);
			const hotSpot = this.addDotHotSpot({ pitch, yaw }, 1);

			// NOTE: convert to image coordinates
			// const x = (yaw / 360 + 0.5) * this.imageSize.width;
			// const y = (0.5 - pitch / 180) * this.imageSize.height;
			// console.log(x, y);

			// NOTE: 預估缺失位置(詹博)
			hotSpot.coordinates = this.transformMatrix(pitch, yaw);

			// NOTE: 在「地圖」上顯示
			this.$emit("addMarker", { id: hotSpot.id, position: hotSpot.coordinates, type: 3 });

			//NOTE: 在「環景」上顯示
			// this.addDotHotSpot(this.getCoords(hotSpot.coordinates), 3);

			// TODO: 排序點(目前非矩形not work)
			// let hotSpotIdOrder = [ this.hotSpotIdList.dot[0] ];
			// for(let i = 1; i < this.hotSpotIdList.dot.length; i++) {
			// 	const hotSpotPos = hotSpotIdOrder[hotSpotIdOrder .length - 1].coordinates;
			// 	const distanceList = this.hotSpotIdList.dot.filter(hotSpot => !hotSpotIdOrder.includes(hotSpot)).map((hotSpot) => {
			// 		return { id: hotSpot.id, distance: calcDistance(hotSpotPos, hotSpot.coordinates)  }
			// 	}).sort((a, b) => (a.distance - b.distance));

			// 	console.log(i, distanceList);
			// 	const hotSpotFilter = this.hotSpotIdList.dot.filter(hotSpot => hotSpot.id == distanceList[0].id)[0];
			// 	hotSpotIdOrder.push(hotSpotFilter);
			// }
			// this.hotSpotIdList.dot = hotSpotIdOrder;

			// 估算長度 & 面積
			this.calcCaseInfo();
		});
		this.panorama.on('mouseup', (evt) => {
			this.$emit('setHeading', this.panorama.getNorthOffset()+this.panorama.getYaw());
		});
		this.panorama.on('animatefinished', () => {
			const panoramaInfo = Object.values(this.panoramaInfoProps.data).flat().filter(l => l.fileName == this.panorama.getScene())[0];
			this.panoramaTestInfo = { Pitch: this.panorama.getPitch(), Yaw: this.panorama.getYaw(), Hfov: this.panorama.getHfov(), position: panoramaInfo.position };
			this.$emit('setHeading', this.panorama.getNorthOffset()+this.panorama.getYaw());
		});

		this.$refs.panoramaView.addEventListener("keydown", (evt) => {
			// console.log(evt);
			// w
			if(evt.keyCode == 87) this.forwardPanorama();
			// s
			if(evt.keyCode == 83) this.backwardPanorama();
			// q
			if(evt.keyCode == 81) {
				const northOffset = this.panorama.getNorthOffset();
				this.panorama.setYaw(-northOffset);
				this.$emit('setHeading', 0);
			}
			// e
			if(evt.keyCode == 69) {
				const northOffset = this.panorama.getNorthOffset();
				this.panorama.setYaw(0);
				this.$emit('setHeading', northOffset);
			}

			evt.stopPropagation();
		})

		this.$el.querySelector("#panorama .pnlm-compass").addEventListener("click", (evt) => {
			const northOffset = this.panorama.getNorthOffset();
			this.panorama.setYaw(-northOffset, 0);
			this.$emit('setHeading', 0);

			evt.stopPropagation();
		});
	},
	methods: {
		setHeading() {
			this.$emit('setHeading', this.panorama.getNorthOffset()+this.panorama.getYaw());
		},
		setStreetViewList() {
			// console.log("setStreetViewList");
			// console.log(JSON.parse(JSON.stringify(this.panoramaInfo)));
			// this.panoramaInfoProps.streetViewList = {};
			// console.log(JSON.parse(JSON.stringify(this.panoramaInfoProps)));

			const lineInfoList = this.panoramaInfoProps.data;
			const panoramaUrl = this.panoramaInfoProps.sceneSetting.assetsUrl;

			for (const lineInfo of lineInfoList) {
				lineInfo.forEach((info, index) => {
					const panoramaPhotoUrl = `${panoramaUrl}/${info.fileName}`;

					this.panoramaInfoProps.streetViewList[info.fileName] = {
						type: "equirectangular",
						panorama: panoramaPhotoUrl,
						hfov: this.panoramaInfoProps.sceneSetting.hfov,
						yaw: this.panoramaInfoProps.sceneSetting.yaw,
						horizonRoll: this.panoramaInfoProps.sceneSetting.horizonRoll,
						compass: true,
						northOffset: info.azimuth,
						autoLoad: true,
					};

					let hotSpots = [];
					const clickHandlerFunc = (evt, clickHandlerArgs) => {
						if(clickHandlerArgs) {
							this.clearHotSpot(clickHandlerArgs.sceneIdNow);
							this.$emit('setMarkerPosition', clickHandlerArgs.sceneIdNow);
							localStorage.sceneIdNow = clickHandlerArgs.sceneIdNow;
						}
					};

					if (index >= 0 && index < lineInfo.length - 1) {
						hotSpots.push({
							pitch: this.panoramaInfoProps.sceneSetting.pitch,
							yaw: this.panoramaInfoProps.sceneSetting.yaw,
							type: "scene",
							text: lineInfo[index + 1].fileName,
							sceneId: lineInfo[index + 1].fileName,
							clickHandlerArgs: {
								sceneIdNow: lineInfo[index + 1].fileName
							},
							clickHandlerFunc
						});
					}

					if (index > 0 && index < lineInfo.length) {
						hotSpots.push({
							pitch: this.panoramaInfoProps.sceneSetting.pitch,
							yaw: this.panoramaInfoProps.sceneSetting.yaw + 180,
							type: "scene",
							text: lineInfo[index - 1].fileName,
							sceneId: lineInfo[index - 1].fileName,
							targetYaw: this.panoramaInfoProps.sceneSetting.yaw + 180,
							clickHandlerArgs: {
								sceneIdNow: lineInfo[index - 1].fileName
							},
							clickHandlerFunc
						});
					}

					this.panoramaInfoProps.streetViewList[info.fileName]["hotSpots"] = hotSpots;
					this.$emit('update:panoramaInfo',this.panoramaInfoProps);
				});
			}	
		},
		removeAllScene() {
			for (const sceneId of this.prevSceneId) this.panorama.removeScene(sceneId);
			this.prevSceneId = [];
		},
		setPanoramaScene() {
			this.removeAllScene();

			// 掛載panorama scene
			for (const sceneId in this.panoramaInfoProps.streetViewList) {
				const panoramaInfo = this.panoramaInfoProps.streetViewList[sceneId];
				this.panorama.addScene(sceneId, panoramaInfo);
				this.prevSceneId.push(sceneId);
			}
		},
		showPanoramaLayer(sceneId) {
			// console.log("showPanoramaLayer");
			this.$emit("showPanoramaLayer", sceneId);
		},
		forwardPanorama() {
			const lineInfoList = this.panoramaInfoProps.data.flat();
			const sceneId = this.panorama.getScene();
			const index = lineInfoList.map((el, index) => { if(el.fileName == sceneId) return index }).filter(el => el != undefined)[0];
			if(index == lineInfoList.length - 1) return;
			else this.showPanoramaLayer(lineInfoList[index+1].fileName);
		},
		backwardPanorama() {
			const lineInfoList = this.panoramaInfoProps.data.flat();
			const sceneId = this.panorama.getScene();
			const index = lineInfoList.map((el, index) => { if(el.fileName == sceneId) return index }).filter(el => el != undefined)[0];
			if(index == 0) return;
			else this.showPanoramaLayer(lineInfoList[index-1].fileName);
		},
		setAutoRotate() {
			if(this.isAutoRotate) {
				this.panorama.setYaw(-80);
				this.panorama.startAutoRotate(-20);
			} else this.panorama.stopAutoRotate();
		},
		trackingCase() {
			const caseFilter = this.caseGeoJson.casePrev.features.filter(caseSpec => caseSpec.properties.Id == Number(this.caseInfo.trackingId));

			if(caseFilter.length > 0) {
				const caseSpec = caseFilter[0].properties;
				this.caseInfo = Object.assign({}, this.caseInfo, {
					distressType: Number(caseSpec.DistressType),
					distressLevel: Number(caseSpec.DistressLevel),
					place: caseSpec.Place,
					direction: caseSpec.Direction,
					lane: caseSpec.Lane,
					isPrev: caseSpec.isPrev
				});
			} else {
				this.$message({
					message: "查無此追蹤Id",
					type: "error",
				});
			}
		},
		uploadCase() {
			this.$confirm(`確定上傳缺失?`, "確認", { showClose: false }).then(() => {
				this.$emit('update:loading', true);
				this.$emit('update:isUpload', true);

				let coordinates = this.hotSpotIdList.dot.map(hotSpot => ([hotSpot.coordinates.lng, hotSpot.coordinates.lat]));
				if(this.caseInfo.distressType != 29) coordinates.push(coordinates[0]);
				// console.log(coordinates);
				this.caseInfo.geoJson = {
					"type": this.caseInfo.distressType == 29 ? "MultiLineString" : 'MultiPolygon',
					"coordinates": this.caseInfo.distressType == 29 ? [ coordinates ] : [[ coordinates ]]
				};
				// console.log(this.caseInfo);

				this.$emit("uploadCase", this.caseInfo);
			}).catch(err => console.log(err));
		},
		// 估算長度 & 面積
		calcCaseInfo() {
			if(this.caseInfo.distressType == 29 && this.hotSpotIdList.dot.length >= 2) {
				this.caseInfo.millingLength =  this.hotSpotIdList.dot.reduce((acc, cur, index, array) => {
					if(array[index + 1] == undefined) return Math.round(acc * 100) / 100;
					return acc += calcDistance(cur.coordinates, array[index + 1].coordinates);
				}, 0)
				this.caseInfo.millingWidth = 0;
			}
			if(this.caseInfo.distressType != 29 && this.hotSpotIdList.dot.length >= 4) {
				const distanceList = this.hotSpotIdList.dot.reduce((acc, cur, index, array) => {
					const nextIndex = (index + 1) % array.length;
					const distance = calcDistance(cur.coordinates, array[nextIndex].coordinates);
					acc.push(distance);

					return acc
				}, []).sort();

				this.caseInfo.millingLength = Math.round(Math.max(...distanceList) * 100) / 100;
				this.caseInfo.millingWidth = Math.round(Math.min(...distanceList) * 100) / 100;
				// this.caseInfo.millingArea = Math.round(calArea(this.hotSpotIdList.dot.map(hotSpot => ([ hotSpot.coordinates.lng, hotSpot.coordinates.lat ]))) * 100) / 100;
			}

			this.calArea();
		},
		calArea() {
			this.caseInfo.millingArea = Math.round(this.caseInfo.millingLength * this.caseInfo.millingWidth * 100 ) / 100;
		},
		getAddress() {
			this.isGetAddress = true;
			const bounds = new google.maps.LatLngBounds();
			this.hotSpotIdList.dot.forEach(hotSpot => bounds.extend(hotSpot.coordinates));
			const point = bounds.getCenter().toJSON();

			getAddress(point).then(res => {
				const resJson = JSON.parse(xml2json(parseXml(res.data), ''));
				const addressJson = JSON.parse(resJson.string['#text']);
				// console.log(addressJson);

				if(addressJson.AddressList.length > 0) this.caseInfo.place = addressJson.AddressList[0].FULL_ADDR;
				else {
					this.$message({
						message: "查無地址",
						type: "error",
					});
				}
				this.isGetAddress = false;
			}).catch(err => {
				console.log(err);
				// this.isGetAddress = false;

				// google Map 查詢地址
				this.geocoder.geocode({ location: point }).then(res => {
					if (res.results[0]) this.caseInfo.place = res.results[0].formatted_address;
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
		screenshot(imgType="imgZoomIn", hfov) {
			hfov = (hfov != undefined) ? hfov : this.panorama.getHfov();
			this.panorama.setHfov(hfov, 100, () => {

				// 街景截圖
				const imgUrl = this.panorama.getRenderer().render(
					this.panorama.getPitch() / 180 * Math.PI,
					this.panorama.getYaw() / 180 * Math.PI,
					this.panorama.getHfov() / 180 * Math.PI,
					{ 'returnImage': true }
				)

				// 載入街景截圖
				const img = new Image();
				img.addEventListener("load", async () => {
					const canvas = document.createElement('canvas');
					// console.log("image: ", img.width, img.height);
					const scale = Math.max(img.width, img.height) >= 1024 ? 1024/Math.max(img.width, img.height) : 1;
					canvas.width = img.width * scale;
					canvas.height = img.height * scale;
					// console.log("canvas: ", canvas.width, canvas.height);
					const canvasContext = canvas.getContext('2d');
					canvasContext.drawImage(img, 0, 0, canvas.width, canvas.height);

					// 隱藏DOM
					this.$el.querySelector("#panorama canvas").setAttribute("data-html2canvas-ignore", true);
					const ignoreDomList = [
						// 切換場景圖示
						...this.$el.querySelectorAll("#panorama .pnlm-hotspot-base.pnlm-hotspot"),
						// 缺失標記圖示
						...this.$el.querySelectorAll("#panorama .pnlm-hotspot-base.hotSpotIcon.alert"),
						// NOTE: 標記紅點圖示
						...this.$el.querySelectorAll("#panorama .pnlm-hotspot-base.hotSpotIcon.redDot")
					];
					for(const dom of ignoreDomList) dom.setAttribute("data-html2canvas-ignore", true);

					// 畫線
					const containerDom = this.$el.querySelector(".pnlm-render-container");
					const dotDomList = this.$el.querySelectorAll("#panorama .pnlm-hotspot-base.hotSpotIcon.redDot");
					const hotSpotIdOrder = this.hotSpotIdList.dot.map(hotSpot => hotSpot.id);
					const { x: x_bg, y: y_bg, width: width_bg, height: height_bg } = containerDom.getBoundingClientRect();
					const [ ratio_width, ratio_height ] = [ canvas.width / width_bg , canvas.height / height_bg ];
					// console.log("containerDom: ", containerDom.getBoundingClientRect());
					canvasContext.beginPath();
					canvasContext.lineWidth = 3;
					canvasContext.strokeStyle = 'red';
					// for(const [ index, dom ] of dotDomList.entries()) {
					for(const [index, hotSpotId] of hotSpotIdOrder.entries()) {
						const dom = [...dotDomList].filter(dom => dom.classList.contains(`id_${hotSpotId}`))[0];
						// console.log(index, dom.getBoundingClientRect());
						const { x: x_el, y: y_el, width: width_el, height: height_el } = dom.getBoundingClientRect();
						const [ x, y ] = [ (x_el - x_bg + width_el/2) * ratio_width, (y_el - y_bg + height_el/2) * ratio_height ];
						// console.log(x, y);
						if(index == 0) canvasContext.moveTo(x, y);
						else canvasContext.lineTo(x, y);
					}
					if(this.caseInfo.distressType != 29) canvasContext.closePath();
					canvasContext.stroke();
					
					// 產出jpg
					html2canvas(containerDom, { canvas, backgroundColor: 'rgba(0, 0, 0, 0)', width: canvas.width, height: canvas.height, scale  }).then(canvas => {
						this.caseInfo[imgType] = canvas.toDataURL("image/jpeg", 0.8);

						if(imgType == "imgZoomIn" && this.caseInfo.imgZoomOut.length == 0) this.screenshot("imgZoomOut", this.panorama.getHfov()+30);
						// NOTE: test download
						// const link = document.createElement('a');
						// link.href = canvas.toDataURL("image/jpeg");
						// link.download = 'test.png';
						// document.body.appendChild(link);
						// link.click();
						// document.body.removeChild(link);
					});
				})
				img.src = imgUrl;
			})
		},
		getYaw(start, end) {
			const dLng = (end.lng - start.lng) * Math.PI / 180;
			const sLat = start.lat * Math.PI / 180;
			const eLat = end.lat * Math.PI / 180;

			const diff_x = Math.cos(sLat) * Math.sin(eLat) - Math.sin(sLat) * Math.cos(eLat) * Math.cos(dLng); //x
			const diff_y = Math.sin(dLng) * Math.cos(eLat);  // y

			// 返回角度,不是弧度
			const angle = Math.atan2(diff_y, diff_x) * 180 / Math.PI;

			return angle
		},
		getPitch(start, end, height = 0) {
			const diff_x = calcDistance(start, end);
			const diff_y = -cameraHeight + height / 2;

			// 返回角度,不是弧度
			// 以Ｘ軸為起點，逆時針為正的角度
			const angle = 360 * Math.atan2(diff_y, diff_x) / (2 * Math.PI);

			return angle;
		},
		getCoords(position) {
			const panoramaInfo = Object.values(this.panoramaInfoProps.data).flat().filter(l => l.fileName == this.panorama.getScene())[0];
			// console.log(panoramaInfo);
			const yaw = this.getYaw(panoramaInfo.position, position) - panoramaInfo.azimuth;
			const pitch = this.getPitch(panoramaInfo.position, position, 0);
			return { pitch, yaw }
		},
		addDotHotSpot({ pitch, yaw }, type) {
			const cssClass = type == 1 ? `hotSpotIcon redDot id_${this.hotSpotId}` : type == 2 ? "hotSpotIcon greenDot" : "hotSpotIcon blueDot";

			const hotSpot = {
				id: this.hotSpotId,
				type: "info",
				pitch,
				yaw,
				text: `${this.hotSpotId}: (Pitch: ${pitch}, Yaw: ${yaw})`,
				cssClass,
				// coordinates: this.transformMatrix(pitch, yaw),
				clickHandlerArgs: {
					id: this.hotSpotId++
				},
				clickHandlerFunc: (evt, clickHandlerArgs) => {
					// console.log("evt: ", evt);
					console.log(`(Pitch: ${pitch}}, Yaw: ${yaw})`);

					if(clickHandlerArgs && evt.shiftKey) {
						console.log("id: ", clickHandlerArgs.id);
						this.panorama.removeHotSpot(clickHandlerArgs.id, this.panorama.getScene());
						this.hotSpotIdList.dot = this.hotSpotIdList.dot.filter(hotSpot => hotSpot.id != clickHandlerArgs.id);

						this.$emit("clearMarker", clickHandlerArgs.id);
					}
				}
			};

			this.panorama.addHotSpot(hotSpot, this.panorama.getScene());
			this.hotSpotIdList.dot.push(hotSpot);

			return hotSpot;
		},
		addCaseHotSpot({ pitch, yaw }, prop, isPrev=false) {
			// console.log(prop);
			const hotSpot = {
				id: this.hotSpotId++,
				caseId: prop.Id,
				type: "info",
				pitch,
				yaw,
				// text: hoverText,
				cssClass: `hotSpotIcon alert ${isPrev ? "prev" : ""} caseId_${prop.Id}`,
				createTooltipArgs: {
					prop
				},
				createTooltipFunc: (div, createTooltipArgs) => {
					// console.log(createTooltipArgs.prop);
					// div.classList.add('pnlm-tooltip');
					
					div.addEventListener('mouseover', (event) => { this.$emit("hightLight", createTooltipArgs.prop.Id) });
					div.addEventListener('mouseout', (event) => { this.$emit("hightLight", this.isSticky ? createTooltipArgs.prop.Id : null) });
				},
				clickHandlerArgs: {
					prop,
					isPrev
				},
				clickHandlerFunc: (evt, clickHandlerArgs) => {
					this.resetCaseHotSpot();

					this.caseInfo = Object.assign({}, this.caseInfo, {
						trackingId: clickHandlerArgs.prop.TrackingId || prop.Id,
						distressType: Number(clickHandlerArgs.prop.DistressType),
						distressLevel: Number(clickHandlerArgs.prop.DistressLevel),
						millingLength: Math.round(clickHandlerArgs.prop.MillingLength * 100) / 100 ,
						millingWidth: Math.round(clickHandlerArgs.prop.MillingWidth * 100) / 100,
						millingArea: Math.round(clickHandlerArgs.prop.MillingArea * 100) / 100,
						place: clickHandlerArgs.prop.Place,
						direction: clickHandlerArgs.prop.Direction,
						lane: clickHandlerArgs.prop.Lane,
						isPrev: clickHandlerArgs.isPrev,
						imgZoomIn: clickHandlerArgs.isPrev || !clickHandlerArgs.prop.ImgZoomIn ? "" : clickHandlerArgs.prop.ImgZoomIn,
						imgZoomOut: clickHandlerArgs.isPrev || !clickHandlerArgs.prop.ImgZoomOut ? "" : clickHandlerArgs.prop.ImgZoomOut
					});

					if(clickHandlerArgs.isPrev) {
						for(const point of clickHandlerArgs.prop.Coordinates) {
							const coordinates = { lat: point[1], lng: point[0] };
							const hotSpot = this.addDotHotSpot(this.getCoords(coordinates), 1);
							hotSpot.coordinates = coordinates;
						}
					} 

					this.isReview = !clickHandlerArgs.isPrev;
					this.isSticky = !this.isSticky; 
				}
			};

			this.panorama.addHotSpot(hotSpot, this.panorama.getScene());
			this.hotSpotIdList.case.push(hotSpot);
		},
		resetCaseHotSpot() {
			this.clearAll();

			if(this.panoramaInfoProps.data.length == 0) return;
			const panoramaInfo = Object.values(this.panoramaInfoProps.data).flat().filter(l => l.fileName == this.panorama.getScene())[0];
			// if(!panoramaInfo) return;

			for(const caseType in this.caseGeoJson) {
				for(const caseSpec of this.caseGeoJson[caseType].features) {
					const geoCoordinates = caseSpec.properties.CenterPt;
					if(calcDistance(panoramaInfo.position, geoCoordinates) <= 15) {
						this.addCaseHotSpot(this.getCoords(geoCoordinates), caseSpec.properties, caseType == 'casePrev');
					}
				}
			}
		},
		clearHotSpot(sceneId = this.panorama.getScene()) {
			for(const type in this.hotSpotIdList) {
				for(const hotSpot of this.hotSpotIdList[type]) {
					this.panorama.removeHotSpot(hotSpot.id, sceneId);
					if(type == 'case') this.hightLight(hotSpot.CaseId, false);
				}
			}
			this.hotSpotIdList = {
				dot: [],
				case: []
			};
			this.$emit("clearMarker");
		},
		hightLight(caseId, isOpen = true) {
			let caseHotSpot = this.$el.querySelectorAll(`.pnlm-hotspot-base.hotSpotIcon.alert.caseId_${caseId}`);
			caseHotSpot = caseHotSpot[caseHotSpot.length - 1];
			// console.log(caseHotSpot);
			if(!caseHotSpot) return;

			if(isOpen) {
				caseHotSpot.classList.add('highlight');
				
				// NOTE: 旋轉至缺失
				// const hotSpot = this.hotSpotIdList.case.filter(hotSpot => (hotSpot.createTooltipArgs.prop.Id == caseId))[0];
				// if(hotSpot) this.panorama.lookAt(hotSpot.pitch, hotSpot.yaw);
			} else caseHotSpot.classList.remove('highlight'); 
		},
		clearAll() {
			this.clearHotSpot();
			this.isReview = false;
			this.isSticky = false;
			this.caseInfo = {
				dateReport: moment().startOf("d"),
				trackingId: 0,
				distressType: "",
				distressLevel: "",
				millingLength: 0,
				millingWidth: 0,
				millingArea: 0,
				place: "",
				direction: 1,
				lane: 1,
				isPrev: false,
				imgZoomIn: "",
				imgZoomOut: ""
			};
		},

		// NOTE: 預估缺失位置(詹博)
		transformMatrix(pitch, yaw) {
			// NOTE: test Transform - Omega(roll): X軸旋轉; Phi(yaw): Y軸旋轉; Kappa(pitch): Z軸旋轉
			const panoramaInfo = Object.values(this.panoramaInfoProps.data).flat().filter(l => l.fileName == this.panorama.getScene())[0];
			const [ Omega, Phi, Kappa ] = [ 0, panoramaInfo.azimuth * Math.PI / 180, 0 ];
			// const [ Omega, Phi, Kappa ] = [ 0, 0, 0 ];

			// Step1: 旋轉矩陣
			const matrix = [
				[ Math.cos(Phi) * Math.cos(Kappa), Math.cos(Omega) * Math.sin(Kappa) + Math.sin(Omega) * Math.sin(Phi) * Math.cos(Kappa), Math.sin(Omega) * Math.sin(Kappa) - Math.cos(Omega) * Math.sin(Phi) * Math.cos(Kappa) ],
				[ -Math.cos(Phi) * Math.sin(Kappa), Math.cos(Omega) * Math.cos(Kappa) - Math.sin(Omega) * Math.sin(Phi) * Math.sin(Kappa), Math.sin(Omega) * Math.cos(Kappa) + Math.cos(Omega) * Math.sin(Phi) * Math.sin(Kappa) ],
				[ Math.sin(Phi), -Math.sin(Omega) * Math.cos(Phi), Math.cos(Omega) * Math.cos(Phi) ]
			];
			// console.log("matrix: ", matrix);

			// Step2: 像素(x, y) 轉成球面座標角度(yaw -> theta; pitch -> phi)
			const [ Theta_sphere, Phi_sphere ] = [ yaw * Math.PI / 180, pitch * Math.PI / 180 ];
			// const Theta_sphere = (x - this.imageSize.width/2) * (360 / this.imageSize.width) * Math.PI / 180;
			// const Phi_sphere = -(y - this.imageSize.height/2) * (360 / this.imageSize.width) * Math.PI / 180;
			// console.log("Theta: ", Theta_sphere * 180 / Math.PI);
			// console.log("Phi: ", Phi_sphere * 180 / Math.PI);
			
			// Step3: 環景影像座標轉換成(X: lng, Y, Z: lat)
			const coordinates = { 
				x: Math.cos(Phi_sphere) * Math.sin(Theta_sphere),
				y: Math.sin(Phi_sphere),
				z: Math.cos(Phi_sphere) * Math.cos(Theta_sphere)
			}
			// console.log("coordinates: ", coordinates);

			// Step4: 修正球型旋轉，並計算 (X,Y,Z) 旋轉後不帶尺度S的向量(P, Q, R)
			const vectorUnit = {
				p: matrix[0][0] * coordinates.x + matrix[1][0] * coordinates.y + matrix[2][0] * coordinates.z,
				q: matrix[0][1] * coordinates.x + matrix[1][1] * coordinates.y + matrix[2][1] * coordinates.z,
				r: matrix[0][2] * coordinates.x + matrix[1][2] * coordinates.y + matrix[2][2] * coordinates.z
			}
			// console.log("vectorUnit: ", vectorUnit);

			// Step5: 假設量測點的相對高度已知，如2.5公尺
			const r = 0.00000900900901  //(度/公尺);
			const S = cameraHeight * r / vectorUnit.q;
			// console.log(S);

			// Step6: 求量測點的三維座標
			const geoCoordinates = {
				lng: panoramaInfo.position.lng - vectorUnit.p * S,
				// z: -cameraHeight - vectorUnit.q * S,
				lat: panoramaInfo.position.lat - vectorUnit.r * S
			}
			// console.log("geoCoordinates: ", geoCoordinates);
			return geoCoordinates;
		},
		formatTime(time) {
			return moment(time).format("YYYY-MM-DD");
		}
	}
}
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
.imgHover
	max-width: 600px
	height: 300px
.panorama-view
	#panorama
		height: calc(100vh - 50px)
		.pnlm-controls
			background-color: rgba(white, 0.5)
			position: absolute
			transform: translateZ(9999px) scale(1.2)
			filter: invert(1)
		.pnlm-controls-container
			height: 100%
			right: 50px
			left: auto
			.pnlm-zoom-controls
				bottom: 20px
			.pnlm-fullscreen-toggle-button
				top: 5px
		.pnlm-compass
			cursor: pointer
			right: 10px
			bottom: 114px
		.btn-forward, .btn-backward
			position: absolute
			right: 18px
			bottom: 90px
			padding: 2px 10px
			font-size: 14px
			z-index: 10
		.btn-forward
			bottom: 170px
		.pnlm-hotspot-base.pnlm-hotspot
			box-shadow: 0px 0px 4px #eee, 0px 0px 6px #444, 0px 0px 10px #FF0000
			animation: hight-light 1.8s infinite both
			@keyframes hight-light
				0%
					box-shadow: 0px 0px 4px #eee, 0px 0px 6px #444, 0px 0px 10px #FF0000
				70% 
					box-shadow: 0px 0px 6px #eee, 0px 0px 8px #444, 0px 0px 16px #FF0000, 0px 0px 18px #eee
				100% 
					box-shadow: 0px 0px 4px #eee, 0px 0px 6px #444, 0px 0px 10px #FF0000
			&:hover > span.pnlm-pointer.pnlm-pointer
				max-width: 40vw
				width: auto !important
		.hotSpotIcon
			cursor: pointer
			width: 26px
			height: 26px
			background-position: center 
			background-size: contain 
			background-repeat: no-repeat 
			&.pnlm-hotspot-base:hover
				z-index: 10
			&.redDot
				background-image: url('../../../public/assets/icon/icon_redDot.png')
				background-size: 20% 
			&.greenDot
				background-image: url('../../../public/assets/icon/icon_greenDot.png')
				background-size: 40% 
			&.blueDot
				background-image: url('../../../public/assets/icon/icon_blueDot.png')
				background-size: 20% 
			&.alert
				background-image: url('../../../public/assets/icon/icon_alert.png')
				background-size: 100% 
				filter: drop-shadow(0px 0px 3px red)
				z-index: 10
				&.prev
					background-image: url('../../../public/assets/icon/icon_alert_plus.png')
					filter: drop-shadow(0px 0px 2px tomato)
				&.highlight
					transform: scale(1.5)
					border: 1px solid #fff
					border-radius: 4px
					background-color: rgba(#fff, 0.4)
				& > span 
					font-size: 14px
					text-align: left
					&::after
						content: ''
						position: absolute
						width: 0
						height: 0
						border-width: 10px
						border-style: solid
						border-color: rgba(0,0,0,0.7) transparent transparent transparent
						bottom: -20px
						left: -10px
						margin: 0 50%
				.info-btn.tracking
					position: relative
					// bottom: 25px
					// right: 30px
					float: right
					color: white
					padding: 0
					background-color: #409EFF
					border-color: #409EFF
					transition-duration: 0s
		.pnlm-hotspot.pnlm-scene
			z-index: 10
			opacity: 0.8
		.info-box
			position: absolute
			width: 280px
			background-color: rgba(white, 0.6)
			z-index: 11
			&.right
				top: 60px
				right: 15px
			.el-card__body
				position: relative
				padding: 5px
				max-height: calc(100vh - 50px - 160px)
				overflow-x: hidden
				overflow-y: auto
				.el-form-item
					margin-bottom: 10px
					.el-form-item__label
						line-height: auto
					.el-select, .road-dir, .el-textarea, .el-date-editor
						width: 160px
						.el-input__inner, .el-textarea__inner
							padding: 5px 0
						.el-input__inner
							text-align: center
					.btn-img-action
						display: flex
						flex-direction: column
						justify-content: space-evenly
						align-items: center
						height: 100px
						& > .el-button
							margin-left: 0
				.btn-action-group
					display: flex
					width: 100%
					padding: 0
					.el-button
						flex: 1
						padding: 10px 0
				.road-dir > .el-input-group__prepend .el-select
						width: 100px
	.btn_panorama
		position: absolute
		bottom: 40px
		left: 40px
		height: 80px
		background-color: white
		background-color: #E1F5FE
		overflow: hidden
		padding: 5px
		z-index: 15
		.v-btn__content
			display: flex
			flex-direction: column
		.name
			white-space: pre-wrap
			text-align: center
			font-size: 14px
</style>