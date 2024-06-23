<template>
	<div class="app-container case-tracking-list" v-loading="loading">
		<h2>巡視判核</h2>
		<div class="filter-container">
			<div class="filter-item">
				<div class="select-contract el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>契約</span>
					</div>
					<el-select v-model.number="listQuery.groupId" class="tender-select" placeholder="請選擇" popper-class="type-select tender" clearable @clear="listQuery.groupId = null">
						<el-option v-for="(obj, id) in options.tenderGroup" :key="id" :value="Number(id)" :label="obj.groupName" />
					</el-select>
				</div>
			</div>
			<time-picker class="filter-item" :shortcutType="'day'" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList"/>
			<el-button type="primary" @click="getList()">搜尋</el-button>
		</div>

		<div class="el-input-group" style="margin-bottom: 10px; max-width: 1260px; min-width: 500px">
			<div class="el-input-group__prepend">
				<el-checkbox v-model="allHeaders" :indeterminate="partHeaders">欄位</el-checkbox>
			</div>
			<el-checkbox-group class="el-input__inner column-filter-item" v-model="headersCheckVal" style="line-height: 15px;">
				<el-checkbox v-for="(value, key) in headers" :key="key" :label="key">{{ value.name }}</el-checkbox>
			</el-checkbox-group>
		</div>

		<el-button v-if="selection.length > 0" type="warning" style="float: right" @click="batch()">批次處理</el-button>
		<h5 v-if="list.length != 0">查詢期間：{{ searchRange }}</h5>

		<el-table
			ref="dataTable"
			empty-text="目前沒有資料"
			:data="list"
			border
			fit
			:row-class-name="tableRowClassName"
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			style="width: 100%"
			@selection-change="handleSelectionChange"
		>
			<el-table-column
				v-for="(value, key) in headersFilter"
				:key="key"
				:prop="key"
				:label="value.name"
				:min-width="value.width"
				align="center"
				:formatter="formatter"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column }">
					<span v-if="column.property.includes('Img')">
						<el-popover popper-class="imgHover" placement="top" trigger="hover" :close-delay="0">
							<el-image style="width: 100%; height: 100%" :src="row[column.property]" fit="scale-down" />
							<el-image slot="reference" style="width: 100%; height: 100%" :src="row[column.property]" fit="scale-down" @click="showImg(row)">
								<template #error>
									<div>查無照片</div>
								</template>
							</el-image>
						</el-popover>
					</span>
					<span v-else-if="column.property == 'Place'">
						<div>{{ row.Place }}</div>
						<el-button class="btn-action" type="info" icon="el-icon-search" plain size="mini" round @click="showMapViewer(row)" />
					</span>
					<span v-else>{{ formatter(row, column) }}</span>
				</template>
			</el-table-column>
			<el-table-column label="狀態" min-width="40" align="center">
				<template slot-scope="{ row }">
					<div v-if="row.PIState & 1 && row.FlowState == 0">待派工</div>
					<div v-else>{{ options.flowStateMap[row.FlowState] }}</div>
					<span v-if="[1, 2].includes(row.FlowState)">({{ formatTime(row.FlowCreateAt) }})</span>
					<span v-else-if="[3, 4].includes(row.FlowState) && row.FlowDesc">({{ row.FlowDesc }})</span>
				</template>
			</el-table-column>
			<el-table-column label="操作" align="center">
				<template slot-scope="{ row }">
					<span v-if="!(row.PIState & 1 || row.PIState & 16) && row.FlowState == 0">
						<el-radio-group v-model="row.state" style="display: flex; flex-direction: column; align-items: flex-start;" @change="handleChange(row)" >
							<el-radio :label="1">派工</el-radio>
							<el-radio :label="3">不需派工
								<el-input v-model="row.reasonNoNeed" style="width: 200px" @change="handleChange(row)" />
							</el-radio>
							<!-- <el-radio :label="4">缺失改判
								<el-input v-model="row.reasonChange" style="width: 200px" @change="handleChange(row)"/>
							</el-radio> -->
						</el-radio-group>
						<br>
						<el-button type="success" size="mini" @click="setState(row)">送出</el-button>
						<!-- <el-button class="btn-action" type="primary" plain size="mini" @click="rowActive= row; dialogEditVisible = true">編輯</el-button> -->
					</span>
					<span v-else>
						<div>{{ row.PIUsername || '-' }}</div>
						<div v-if="row.PICreateAt">({{ formatTime(row.PICreateAt) }})</div>
						<el-button v-if="!(row.PIState & 16) && row.PIState & 1 && row.FlowState == 0" size="mini" plain round @click="setPIState(row, -1)">撤銷</el-button>
					</span>
				</template>
			</el-table-column>
			<el-table-column type="selection" align="center" width="55" />
		</el-table>

		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" />

		<!-- 修改 -->
		<el-dialog
			class="dialog-editor"
			:visible.sync="dialogEditVisible"
			title="缺失編輯"
			width="700px"
			:show-close="false"
			center
		>
			<el-form label-position="left" :model="rowActive" :rules="rules" ref="form" label-width="140px" class="case-edit-form">
				<el-row :gutter="10">
					<el-col :span="12">
						<el-form-item prop="id" label="缺失Id">
							<span>{{ rowActive.id }}</span>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item prop="SerialNo" label="查報案號">
							<span>{{ rowActive.SerialNo }}</span>
						</el-form-item>
					</el-col>
				</el-row>
				<el-form-item label="設施類型" prop="type" size="small">
					<div style="display: flex; width: 300px; gap: 5px;">
						<el-select class="edit-select" v-model.number="rowActive.RoadType" size="mini" popper-class="type-select" style="width: 100px" @change="changeDeviceType()">
							<el-option label="道路" :value="1" /> 
							<el-option label="設施" :value="2" /> 
						</el-select>
						<el-select v-model="rowActive.DeviceTypePlus" placeholder="請選擇" size="mini" style="width: 100px" @change="rowActive.MillingDepth = 0">
							<el-option v-for="(val, key) in deviceTypeFilter" :key="key" :label="val.name" :value="Number(key)" />
						</el-select>
					</div>
				</el-form-item>
				<el-form-item prop="Postal_vil" label="里別">
					<el-input v-model="rowActive.Postal_vil" style="width: 200px" size="small" />
				</el-form-item>
				<el-form-item prop="Place" label="地址">
					<el-input v-model="rowActive.Place" size="small">
						<el-button slot="append" class="btn-action" type="info" icon="el-icon-search" plain size="mini" @click="showMapViewer(rowActive)" />
					</el-input>
				</el-form-item>
				<el-form-item prop="Direction" label="車道">
					<el-input class="road-dir" v-model="rowActive.Lane" size="small">
						<el-select slot="prepend" v-model="rowActive.Direction" popper-class="type-select" size="small">
							<el-option v-for="(name, id) in options.roadDir" :key="id" :label="name" :value="Number(id)" />
						</el-select>
					</el-input>
				</el-form-item>
				<el-form-item label="通報日期" prop="DateCreate" required>
					<el-date-picker v-model="rowActive.DateCreate" type="date" placeholder="選擇日期" size="small" />
				</el-form-item>
				<el-form-item label="損壞類別" prop="DistressType">
					<div style="display: flex; width: 220px; gap: 5px;">
						<el-select class="edit-select" v-model.number="rowActive.DistressType" size="mini" popper-class="type-select" style="flex: 2">
							<el-option v-for="(name, type) in options.DistressTypeFlat" :key="`DistressType_${type}`" :label="name" :value="Number(type)" />
						</el-select>
						<el-select class="edit-select" v-model.number="rowActive.DistressLevel" size="mini" popper-class="type-select" style="flex: 1">
							<el-option v-for="(name, type) in options.DistressLevel" :key="`DistressLevel_${type}`" :label="name" :value="Number(type)" />
						</el-select>
					</div>
				</el-form-item>
				<el-form-item label="施工前照片" prop="image">
					<el-row :gutter="10">
						<el-col v-if="String(rowActive.ImgZoomIn).match(/.JPG|.jpg|.Jpg/g)" :span="6">
							<el-image class="img-preview" style="width: 100%; height: 100%; cursor: pointer" :src="rowActive.ImgZoomIn" :preview-src-list="[rowActive.ImgZoomIn, rowActive.ImgZoomOut]" fit="contain" :z-index="99" />
						</el-col>
						<el-col v-if="String(rowActive.ImgZoomOut).match(/.JPG|.jpg|.Jpg/g)" :span="6">
							<el-image class="img-preview" style="width: 100%; height: 100%; cursor: pointer" :src="rowActive.ImgZoomOut" :preview-src-list="[rowActive.ImgZoomIn, rowActive.ImgZoomOut]" fit="contain" :z-index="99" />
						</el-col>
					</el-row>
				</el-form-item>
				<el-form-item v-if="rowActive.RoadType == 1" label="預估銑刨深度" prop="MillingDepth">
					<el-radio-group v-model="rowActive.MillingDepth">
						<el-radio :label="0">0cm</el-radio>
						<el-radio v-if="rowActive.DeviceTypePlus == 12" :label="4">4cm</el-radio>
						<el-radio v-if="rowActive.DeviceTypePlus != 12" :label="5">5cm</el-radio>
						<el-radio v-if="rowActive.DeviceTypePlus != 12" :label="10">10cm</el-radio>
					</el-radio-group>
				</el-form-item>
				<el-form-item label="預估銑鋪面積" prop="desc">
					<el-row v-if="rowActive.editFormula" :gutter="5" type="flex" align="middle">
						<el-col :span="4"><el-tag class="btn-tag" type="success" @click="rowActive.editFormula = false; calArea(rowActive);">自訂</el-tag></el-col>
						<el-col :span="16"><el-input v-model="rowActive.MillingFormula" @change="calArea(rowActive)" /></el-col>
						<el-col :span="4" style="line-height: 36px"> = {{ rowActive.MillingArea }}㎡</el-col>
					</el-row>
					<el-row v-else :gutter="5" type="flex" align="middle">
						<el-col :span="4"><el-tag class="btn-tag" @click="rowActive.editFormula = true; calArea(rowActive);">簡單</el-tag></el-col>
						<el-col :span="6"><el-input v-model="rowActive.MillingLength" @change="calArea(rowActive)" /></el-col>
						<el-col :span="2" style="line-height: 36px; text-align: center">✕</el-col>
						<el-col :span="6"><el-input v-model="rowActive.MillingWidth" @change="calArea(rowActive)" /></el-col>
						<el-col :span="4" style="line-height: 36px"> = {{ rowActive.MillingArea }}㎡</el-col>
					</el-row>
				</el-form-item>
			</el-form>

			<span slot="footer" class="dialog-footer">
				<!-- <el-button type="danger" @click="setPIState(rowActive, 16)">刪除</el-button> -->
				<el-button type="primary" @click="editCase()">確定</el-button>
				<el-button @click="dialogEditVisible = false">取消</el-button>
			</span>
		</el-dialog>

		<el-image-viewer
			v-if="showImgViewer"
			class="img-preview"
			:on-close="() => { showImgViewer = false; }"
			:url-list="imgUrls"
		/>

		<!-- map -->
		<el-dialog class="dialog-map" :visible.sync="dialogMapVisible" width="600px">
			<map-viewer :map.sync="map"/>
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import { getTenderGroup, getDTypeMap } from "@/api/type";
import { carCaseList, setCarCaseList } from "@/api/car";
import { setCaseTrackingSpec, setCaseTrackingFlow } from "@/api/inspection";
import { setInsCaseList } from "@/api/PI";
import { setInspectFlowList } from "@/api/app";
import Pagination from "@/components/Pagination";
import TimePicker from '@/components/TimePicker';
import MapViewer from "@/components/MapViewer";
import ElImageViewer from 'element-ui/packages/image/src/image-viewer';

export default {
	name: "caseTrackingList",
	components: { TimePicker, Pagination, ElImageViewer, MapViewer },
	data() {
		return {
			loading: false,
			showImgViewer: false,
			dialogMapVisible: true,
			dialogEditVisible: false,
			dialogFilterVisible: false,
			timeTabId: 0,
			dateRange: [ moment().startOf("day").toDate(), moment().endOf("day").toDate() ],
			searchRange: "",
			scrollTop: 0,
			map: {},
			imgUrls: "",
			screenWidth: window.innerWidth,
			listQuery: {
				filter: false,
				groupId: 91,
				caseType: [],
				pageCurrent: 1,
				pageSize: 50,
			},
			headers: {
				id: {
					name: "缺失Id",
					sortable: true,
					default: true,
					width: 30
				},
				DistressType: {
					name: "缺失類型",
					sortable: true,
					default: true,
					width: 40
				},
				DistressLevel: {
					name: "損壞程度",
					sortable: true,
					default: true,
					width: 40
				},
				DateCreate: {
					name: "通報時間",
					sortable: true,
					default: false,
					width: 40
				},
				Place: {
					name: "地址",
					sortable: true,
					default: true,
					width: 80
				},
				roadDir: {
					name: "車道",
					sortable: false,
					default: false,
					width: 30
				},
				MillingLength: {
					name: "長度(m)",
					sortable: true,
					default: false,
					width: 30
				},
				MillingWidth: {
					name: "寬度(m)",
					sortable: true,
					default: false,
					width: 30
				},
				MillingArea: {
					name: "面積(㎡)",
					sortable: true,
					default: false,
					width: 30
				},
				ImgZoomIn: {
					name: "近照",
					sortable: false,
					default: true
				}
			},
			total: 0,
			list: [],
			rowActive: {},
			selection: [],
			headersCheckVal: [],
			typeLevel: {},
			caseInfo: {},
			allHeaders: false,
			rules: {
				Place: [
					{ required: true, message: '必填', trigger: 'blur' }
				],
				Direction: [
					{ required: true, message: '必填', trigger: 'blur' }
				],
				DateCreate: [
					{ required: true, message: '必填', trigger: 'change' }
				],
			},
			options: {
				tenderGroup: {},
				DeviceType: {
					11: {
						name: "AC路面",
						roadType: 1
					},
					12: {
						name: "熱再生",
						roadType: 1
					},
					20: {
						name: "人行道",
						roadType: 2
					},
					30: {
						name: "側溝",
						roadType: 2
					},
				},
				DistressType: {},
				DistressTypeFlat: {},
				DistressLevel: {
					1: "輕",
					2: "中",
					3: "重"
				},
				roadDir: {
					// 0: "無",
					1: "順",
					2: "逆"
				},
				flowStateMap: {
					0: '未審查',
					1: '派工中',
					2: '完工',
					3: '不需施作',
					4: '改判'
				}
			}
		};
	},
	computed: {
		deviceTypeFilter() {
			const deviceTypeFilter = {};
			Object.keys(this.options.DeviceType).forEach(key => {
				if(this.options.DeviceType[key].roadType == this.rowActive.RoadType) deviceTypeFilter[key] = this.options.DeviceType[key];
			})
			return deviceTypeFilter
		},
		checked: {
			get() {
				return this.listQuery.caseType.map(type => (type[0]));
			},
			set(val) {
				const caseTypeArr = this.listQuery.caseType.map(type => type[0]);
				const addTypeArr = val.filter(type => !caseTypeArr.includes(type));
				const removeTypeArr = caseTypeArr.filter(type => !val.includes(type));

				for(const type of removeTypeArr) {
					this.listQuery.caseType = this.listQuery.caseType.filter(typeArr => typeArr[0] != type);
					this.$delete(this.typeLevel, type);
				}

				for(const type of addTypeArr) {
					this.listQuery.caseType.push([type, [0]]);
					this.$set(this.typeLevel, type, [0]);
				}
			}
		},
		partHeaders() {
			return (this.headersCheckVal.length != 0 && this.headersCheckVal.length < Object.keys(this.headers).length);
		},
		headersFilter() {
			return Object.keys(this.headers)
				.filter(key => this.headersCheckVal.includes(key))
				.reduce((result, key) => {
					result[key] = this.headers[key];
					return result;
				}, {});
		},
	},
	watch: {
		allHeaders(val) {
			if (val) this.headersCheckVal = Object.keys(this.headers);
			else this.headersCheckVal = [];
		}
	},
	created() {
		if (this.allHeaders) this.headersCheckVal = Object.keys(this.headers);
		else this.headersCheckVal = Object.keys(this.headers).filter(key => this.headers[key].default);

		getTenderGroup().then(response => { this.options.tenderGroup = response.data.tenderGroup });

		getDTypeMap().then(response => {
			this.options.DistressType = response.data.distressTypeMap;
			this.options.DistressTypeFlat = Object.values(this.options.DistressType).reduce((acc, cur) => {
				for (const key in cur) acc[key] = cur[key];
				return acc;
			}, {});
		})
	},
	mounted() {
		this.dialogMapVisible = false;
	},
	methods: {
		tableRowClassName({row, rowIndex}) {
			if (row.PIState & 1) return 'success-row';
			else if (row.PIState & 16) return 'danger-row';
			else return '';
		},
		showImg(row) {
			this.imgUrls = [ row.ImgZoomIn ];
			this.showImgViewer = true;
		},
		changeTypeLevel() {
			Object.keys(this.typeLevel).forEach(key => {
				if(this.typeLevel[key].includes(0) || (this.typeLevel[key].includes(1) && this.typeLevel[key].includes(2) && this.typeLevel[key].includes(3))) 
					this.typeLevel[key] = [0];
			})
		},
		changeDeviceType() {
			this.rowActive.DeviceTypePlus = Number(Object.keys(this.deviceTypeFilter)[0]); 
		},
		showMapViewer(row) {
			// console.log("showMap");
			this.map.data.forEach(feature => this.map.data.remove(feature));
			this.dialogMapVisible = true;

			let geoJSON_case = { 
				"type": "FeatureCollection",
				"name": "polyJSON",
				"features": []
			};
			// console.log(row.wkb_geometry);

			geoJSON_case.features.push({
				"type": "Feature",
				"properties": { },
				"geometry": row.CenterPt
			});

			// console.log(geoJSON_case);

			this.map.data.addGeoJson(geoJSON_case);
			this.map.data.setStyle({ 
				strokeColor: '#F56C6C',
				strokeWeight: 3,
				strokeOpacity: 0.9,
				fillColor: '#F56C6C',
				fillOpacity: 0.8
			});
			this.map.setCenter({ lat: row.CenterPt.coordinates[1], lng: row.CenterPt.coordinates[0] });

			const zoom = this.map.getZoom();
			this.map.setZoom(zoom < 21 ? 21 : zoom);
		},
		getList() {
			if (!this.listQuery.groupId) {
				this.$message({
					message: "請選擇契約",
					type: "error",
				});
			} else {
				this.loading = true;
				let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
				let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
				this.searchRange = startDate + " - " + endDate;

				this.list = [];
				this.total = 0;
				this.selection = [];

				carCaseList({
					groupId: this.listQuery.groupId,
					timeStart: startDate,
					timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD"),
					pageCurrent: this.listQuery.pageCurrent,
					pageSize: this.listQuery.pageSize
				}).then(response => {
					if (response.data.list.length == 0) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
						this.total = 0;
					} else {
						this.total = response.data.total;
						this.list = response.data.list;
						this.list.forEach(l => {
							l.DateCreate = this.formatTime(l.DateCreate);
							this.$set(l, "DeviceTypePlus", Number(`${l.DeviceType}${l.RestoredType}`));
							l.MillingLength = Math.round(l.MillingLength * 100) / 100;
							l.MillingWidth = Math.round(l.MillingWidth * 100) / 100;
							l.MillingArea = Math.round(l.MillingArea * 100) / 100;
							this.$set(l, "editFormula", l.MillingFormula != '0');
							l.ImgZoomInUnMark = l.ImgZoomIn ? l.ImgZoomIn.replace("caseDetection", "caseDetection_unMark").replace("ImgZoomIn", "ImageZoomIn_unMark") : null;
							this.$set(l, "status", 0);
							this.$set(l, "reasonNoNeed", "");
							this.$set(l, "reasonChange", "");
						})

						this.$nextTick(() => document.documentElement.scrollTop = this.scrollTop);
					}
					this.getImportCaseList();
					this.loading = false;
				}).catch(err => this.loading = false);
			}
		},
		editCase() {
			this.$refs.form.validate((valid) => {
				if (valid) {
					this.scrollTop = document.documentElement.scrollTop;
					const [ DeviceType, RestoredType ] = String(this.rowActive.DeviceTypePlus).split("").map(type => Number(type));

					setCaseTrackingSpec(this.rowActive.SerialNo, {
						DetectionId: this.rowActive.id,
						RoadType: this.rowActive.RoadType,
						DeviceType,
						RestoredType,
						Place: this.rowActive.Place,
						Postal_vil: this.rowActive.Postal_vil,
						Lane: this.rowActive.Lane,
						Direction: this.rowActive.Direction,
						DateCreate: this.rowActive.DateCreate,
						DistressType: this.rowActive.DistressType,
						DistressLevel: this.rowActive.DistressLevel,
						MillingLength: this.rowActive.MillingLength,
						MillingWidth: this.rowActive.MillingWidth,
						MillingDepth: this.rowActive.MillingDepth,
						MillingFormula: this.rowActive.MillingFormula,
						MillingArea: this.rowActive.MillingArea
					}).then(response => {
						if (response.statusCode == 20000) {
							this.$message({
								message: "修改成功",
								type: "success",
							});
						} else {
							this.$message({
								message: "修改失敗",
								type: "error",
							});
						}
						this.getList();
						this.dialogEditVisible = false;
					}).catch((err) => {
						console.log(err);
						this.getList();
					});
				} else {
					console.log('error submit!!');
					return false;
				}
			});
		},
		setState(row) {
			this.$confirm(`確定提交?`, "確認", { showClose: false }).then(() => {
				this.scrollTop = document.documentElement.scrollTop;
				if(row.state == 1) {
					this.loading = true;

					// TODO: V1 (之後拔掉)
					setInsCaseList(row.SerialNo, {
						PCIValue: row.PCIValue,
						PIState: row.PIState += row.state,
						PIStateNotes: row.PIStateNotes
					}).then(response => {
						// if (response.statusCode == 20000) {
						// 	this.$message({
						// 		message: "提交成功",
						// 		type: "success",
						// 	});
						// 	this.getList();
						// }
					}).catch(err => {
						console.log(err);
						// this.getList();
					})

					// V2
					setCaseTrackingFlow(row.SerialNo, {
						flowState: row.state,
						// flowDesc: ''
					}).then(response => {
						if (response.statusCode == 20000) {
							this.$message({
								message: "提交成功",
								type: "success",
							});
							this.getList();
						}
					}).catch(err => {
						console.log(err);
						this.getList();
					})

					// 巡視判核 (派工, 不須派工)
					setCarCaseList(row.SerialNo, {
						flowState: row.state,
						flowDesc: ''
					}).then(response => {
						if (response.statusCode == 20000) {
							this.$message({
								message: "提交成功",
								type: "success",
							});
							this.getList();
						}
					}).catch(err => {
						console.log(err);
						this.getList();
					})

				} else {
					if (
						(row.state == 3 && (!row.reasonNoNeed || row.reasonNoNeed.length == 0))
						||
						(row.state == 4 && (!row.reasonChange || row.reasonChange.length == 0))
					) {
						this.$message({
							message: "請輸入原因",
							type: "error",
						});
					} else {
						this.loading = true;
						setInspectFlowList(row.SerialNo, {
							flowState: row.state,
							flowDesc: (row.state == 3) ? row.reasonNoNeed : row.reasonChange
						}).then(response => {
							if (response.statusCode == 20000) {
								this.$message({
									message: "提交成功",
									type: "success",
								});
								this.getList();
							}
						}).catch(err => {
							console.log(err);
							this.getList();
						})
					}
				}
			}).catch(err => console.log(err));
		},
		setPIState(row, result) {
			this.$confirm(`確定提交?`, "確認", { showClose: false }).then(() => {
				this.loading = true;
				this.scrollTop = document.documentElement.scrollTop;
				row.PIState += result;

				setInsCaseList( row.SerialNo, {
					PCIValue: row.PCIValue,
					PIState: row.PIState,
					PIStateNotes: row.PIStateNotes
				}).then(response => {
					if ( response.statusCode == 20000 ) {
						this.$message({
							message: "提交成功",
							type: "success",
						});
						this.getList();
					} 
				}).catch(err => {
					console.log(err);
					this.getList();
				})
			}).catch(err => console.log(err));
		},
		async batch() {
			this.$confirm(`確定提交?`, "確認", { showClose: false }).then(async () => {
				this.loading = true;
				this.scrollTop = document.documentElement.scrollTop;
				for(const [index, row] of this.selection.entries()) {
					if (row.state == 1) {
						await setInsCaseList(row.SerialNo, {
							PCIValue: row.PCIValue,
							PIState: row.PIState += row.state,
							PIStateNotes: row.PIStateNotes
						})
					} else {
						if (
							(row.state == 3 && (!row.reasonNoNeed || row.reasonNoNeed.length == 0))
							||
							(row.state == 4 && (!row.reasonChange || row.reasonChange.length == 0))
						) {
							this.$message({
								message: `缺失Id${row.id}未輸入原因`,
								type: "error",
							});
						} else {
							await setInspectFlowList(row.SerialNo, {
								flowState: row.state,
								flowDesc: (row.state == 3) ? row.reasonNoNeed : row.reasonChange
							})
						}
					}

					if(index == this.selection.length -1) this.getList();
				}
			}).catch(err => console.log(err));
		},
		filterDialogOpen() {
			this.dialogFilterVisible = true;
			this.caseTypeTemp = JSON.parse(JSON.stringify(this.listQuery.caseType));
		},
		filterConfirm() {
			this.listQuery.pageCurrent = 1;
			this.dialogFilterVisible = false;
			this.getList();
		},
		filterCancel() {
			this.dialogFilterVisible = false;
			this.listQuery.caseType = JSON.parse(JSON.stringify(this.caseTypeTemp));
		},
		filterClear() {
			this.listQuery.caseType = [];
			this.typeLevel = {};
			this.listQuery.pageCurrent = 1;
			this.getList();
		},
		calArea(row) {
			const replaceObj = { " ": "", "m": "", "M": "", "=": "", "＝": "", "＋": "+", "－": "-", "＊": "*", "x": "*", "X": "*", "×": "*", "／": "/", "（": "(", "）": ")",
				"０": '0', "１": "1", "２": "2", "３": "3", "４": "4", "５": "5", "６": "6", "７": "7", "８": "8", "９": "9" };
			// const regex = new RegExp('^[0-9*+\/().-]+$', 'g');
			const regex = /^[^*+/-](?:[*+/\-]?[(]*\d+\.?\d*[)]*)+$/g;
			
			if( (row.editFormula == undefined && row.MillingFormula && row.MillingFormula != '0' && row.MillingFormula.length != 0) || row.editFormula)  {
				for(const key in replaceObj) row.MillingFormula = row.MillingFormula.replaceAll(key, replaceObj[key]);
				row.MillingArea = regex.test(row.MillingFormula) ? Math.round(new Function(`return ${row.MillingFormula}`)() * 100) / 100 : 0;
			} else row.MillingArea = Math.round(row.MillingLength * row.MillingWidth * 100) / 100;
		},
		handleSelectionChange(val) {
			this.selection = val;
		},
		handleChange(row) {
			this.$refs.dataTable.toggleRowSelection(row, true);
			this.selection = this.selection.filter(rowSpec => rowSpec.id != row.id);
			this.selection.push(row);
		},
		formatter(row, column) {
			if (["DistressType"].includes(column.property)) return this.options.DistressTypeFlat[row.DistressType];
			else if (["DistressLevel"].includes(column.property)) return this.options.DistressLevel[row.DistressLevel];
			else if (["roadDir"].includes(column.property)) return `${this.options.roadDir[row.Direction]}-${row.Lane}`;
			else if (!["SerialNo", "id", "Id"].includes(column.property) && Number(row[column.property])) return (Math.round(row[column.property] * 100)/100).toLocaleString();
			else return row[column.property] || "-";
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
.imgHover
	max-width: 400px
	// height: 400px
.case-tracking-list
	.filter-container
		.filter-item
			margin-right: 5px
			.el-select.tender-select
				width: 400px
				.el-input__inner
					padding-left: 10px
					text-align: left
	.el-table
		.success-row
			background: #F3FDED
			&.hover-row > td
				background-color: initial !important
		.danger-row
			background: #F9EBEB
			&.hover-row > td
				background-color: initial !important
	.img-preview
		width: 100%
		.el-image-viewer__mask
			opacity: 0.7
		.el-icon-circle-close
			color:  #FFF
	.dialog-filter
		.el-checkbox__label
			font-size: 12px
		.el-select
			width: 100px
			margin-top: -5px
			margin-bottom: 10px
			.el-select__tags > span
				display: flex
			.el-input__inner
				padding: 0 13px 0 5px
				text-align: center
				background-color: transparent
			.el-input__suffix
				right: 0px
				margin-right: -3px
				transform: scale(0.7)
	.dialog-editor
		.case-edit-form
			width: 65vw
			max-width: 650px
			.el-form-item
				margin-bottom: 16px
				.el-form-item__label
					color: #999
				.road-dir 
					width: 160px
					.el-input__inner
						text-align: center
					& > .el-input-group__prepend .el-select
						width: 80px
						margin: -2px -20px
				.btn-tag
					cursor: pointer
	.dialog-map
		min-height: 300px 
		.el-dialog__body
			height: 30%
</style>