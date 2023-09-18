<template>
	<div class="app-container case-tracking-list" v-loading="loading">
		<h2>追蹤列表</h2>
		<aside style="white-space: pre-line">
			預設列出「中度」以上的缺失。
		</aside>
		<div class="filter-container">
			<div v-if="listQuery.tenderRound > 0" class="filter-item">
				<div class="select-contract el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>合約</span>
					</div>
					<el-select v-model.number="listQuery.tenderRound" class="tender-select" popper-class="type-select tender">
						<el-option v-for="(val, type) in options.tenderRoundMap" :key="type" :label="val.name" :value="Number(type)" />
					</el-select>
				</div>
			</div>
			<el-button v-if="listQuery.tenderRound > 0" type="primary" @click="getList()">搜尋</el-button>

			<el-button
				class="filter-item"
				:type="listQuery.caseType.length == 0 ? 'success' : 'danger'"
				:plain="listQuery.caseType.length != 0"
				icon="el-icon-s-order"
				@click="filterDialogOpen"
				>過濾</el-button>
			<el-button
				v-if="listQuery.caseType.length != 0"
				type="text"
				size="mini"
				@click="filterClear"
				>清空過濾條件</el-button>
			<el-checkbox v-model="listQuery.filter" style="margin-left: 20px">已刪除</el-checkbox>
		</div>

		<div class="el-input-group" style="margin-bottom: 10px; max-width: 1400px; min-width: 500px">
			<div class="el-input-group__prepend">
				<el-checkbox v-model="allHeaders" :indeterminate="partHeaders">欄位</el-checkbox>
			</div>
			<el-checkbox-group class="el-input__inner column-filter-item" v-model="headersCheckVal" style="line-height: 15px;">
				<el-checkbox v-for="(value, key) in headers" :key="key" :label="key">{{ value.name }}</el-checkbox>
			</el-checkbox-group>
		</div>

		<el-table
			empty-text="目前沒有資料"
			:data="list"
			border
			fit
			:row-class-name="tableRowClassName"
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			style="width: 100%"
		>
			<el-table-column
				v-for="(value, key) in headersFilter"
				:key="key"
				:prop="key"
				:label="value.name"
				:width="value.width"
				align="center"
				:formatter="formatter"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column }">
					<span v-if="column.property.includes('Img')">
						<el-popover popper-class="imgHover" placement="top" trigger="hover" :close-delay="0">
							<el-image style="width: 100%; height: 100%" :src="row[column.property]" fit="scale-down" />
							<el-image slot="reference" style="width: 100%; height: 100%" :src="row[column.property]" fit="scale-down" @click="showImg(row, column.property)"/>
						</el-popover>
					</span>
					<span v-else>{{ formatter(row, column) }}</span>
				</template>
			</el-table-column>
			<el-table-column label="操作" align="center">
				<template slot-scope="{ row }">
					<el-button-group>
						<el-button class="btn-action" type="info" icon="el-icon-search" plain size="mini" round @click="showMapViewer(row)" />
						<el-button v-if="!(row.PIState & 16) && row.PIState & 1" size="mini" plain round @click="setResult(row, -1)">撤銷</el-button>
						<el-button v-else-if="!(row.PIState & 16)" type="success" size="mini" @click="setResult(row, 1)">抽查</el-button>
						<el-button v-if="(row.PIState & 16)" size="mini" plain round @click="setResult(row, -16)">撤銷</el-button>
						<el-button v-if="!(row.PIState & 16)" class="btn-action" type="primary" plain size="mini" round @click="rowActive= row; dialogEditVisible = true">編輯</el-button>
					</el-button-group>
				</template>
			</el-table-column>
		</el-table>

		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" />

		<!-- 過濾 -->
		<el-dialog
			class="dialog-filter"
			:visible.sync="dialogFilterVisible"
			title="過濾條件"
			width="1100px"
			:show-close="false"
			center
		>
			<el-row :gutter="15">
				<el-col :span="6" v-for="distressId in options.distressTypeOrder" :key="distressId" style="display: flex; justify-content: space-between">
					<el-checkbox v-model="checked" :label="distressId">
						{{ options.DistressType[distressId] }} ({{ caseInfo[distressId] || 0 }})
					</el-checkbox>
					<el-select v-model="typeLevel[distressId]" placeholder="請選擇" size="mini" popper-class="type-select" multiple :disabled="!checked.includes(distressId)" @change="changeTypeLevel">
						<el-option v-for="order in [0, 3, 2, 1]" :key="order" :value="order" :label="order == 0 ? '全部' : options.DistressLevel[order]" />
					</el-select>
				</el-col>
			</el-row>

			<span slot="footer" class="dialog-footer">
				<el-button @click="filterCancel">取消</el-button>
				<el-button type="primary" @click="filterConfirm">確定</el-button>
			</span>
		</el-dialog>

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
						<el-button slot="append" class="btn-action" type="info" icon="el-icon-search" plain size="mini" @click="showMapViewer(rowActive, true)" />
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
							<el-option v-for="(name, type) in options.DistressType" :key="`DistressType_${type}`" :label="name" :value="Number(type)" />
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
						<el-radio v-if="rowActive.DeviceTypePlus == 11" :label="4">4cm</el-radio>
						<el-radio v-if="rowActive.DeviceTypePlus != 11" :label="5">5cm</el-radio>
						<el-radio v-if="rowActive.DeviceTypePlus != 11" :label="10">10cm</el-radio>
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
				<el-button type="danger" @click="setResult(rowActive, 16)">刪除</el-button>
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
import { getTenderRound } from "@/api/type";
import { getCaseTrackingList, setCaseTrackingSpec } from "@/api/inspection";
import { setInsCaseList } from "@/api/PI";
import Pagination from "@/components/Pagination";
import MapViewer from "@/components/MapViewer";
import ElImageViewer from 'element-ui/packages/image/src/image-viewer';

export default {
	name: "caseTrackingList",
	components: { Pagination, ElImageViewer, MapViewer },
	data() {
		return {
			loading: false,
			isUpload: false,
			showImgViewer: false,
			dialogMapVisible: true,
			dialogEditVisible: false,
			dialogFilterVisible: false,
			scrollTop: 0,
			map: {},
			imgUrls: "",
			// timeTabId: moment().year(),
			// dateTimePickerVisible: false,
			screenWidth: window.innerWidth,
			// dateRange: [
			// 	moment().year(2022).month(5).startOf("month").toDate(),
			// 	moment().endOf("year").toDate(),
			// ],
			listQuery: {
				filter: false,
				tenderRound: 91,
				caseType: [],
				pageCurrent: 1,
				pageSize: 50,
			},
			headers: {
				id: {
					name: "缺失Id",
					sortable: true,
					width: 80
				},
				TrackingId: {
					name: "追蹤Id",
					sortable: false,
					width: 80
				},
				DistressType: {
					name: "缺失類型",
					sortable: true,
					width: 160
				},
				DistressLevel: {
					name: "損壞程度",
					sortable: true,
					width: 80
				},
				DateCreate: {
					name: "通報時間",
					sortable: true,
					width: 150
				},
				Place: {
					name: "地址",
					sortable: true
				},
				roadDir: {
					name: "車道",
					sortable: false,
					width: 110
				},
				MillingLength: {
					name: "長度(m)",
					sortable: true,
					width: 80
				},
				MillingWidth: {
					name: "寬度(m)",
					sortable: true,
					width: 80
				},
				MillingArea: {
					name: "面積(㎡)",
					sortable: true,
					width: 80
				},
				ImgZoomIn: {
					name: "近照",
					sortable: false
				},
				ImgZoomOut: {
					name: "遠照",
					sortable: false
				}
			},
			total: 0,
			list: [],
			rowActive: {},
			headersCheckVal: [],
			typeLevel: {},
			caseInfo: {},
			allHeaders: true,
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
				tenderRoundMap: {},
				DeviceType: {
					10: {
						name: "AC路面",
						roadType: 1
					},
					11: {
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
					// 4: {
					// 	name: "標線",
					// }
				},
				DistressType: {
					15: "坑洞",
					29: "縱向及橫向裂縫",
					16: "龜裂",
					32: "車轍",
					18: "隆起與凹陷",
					34: "人手孔缺失",
					51: "薄層剝離",
					21: "其他",
					50: "塊狀裂縫",
					53: "推擠",
					65: "補綻及管線回填",
					54: "冒油",
					55: "波浪狀鋪面",
					56: "車道與路肩分離",
					49: "滑溜裂縫",
					66: "骨材剝落",
					58: "人孔高差"
				},
				distressTypeOrder: [ 15, 29, 16, 32, 18, 34, 51, 21, 50, 53, 65, 54, 55, 56, 49, 66, 58 ],
				DistressLevel: {
					1: "輕",
					2: "中",
					3: "重"
				},
				roadDir: {
					// 0: "無",
					1: "順",
					2: "逆"
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
		else this.headersCheckVal = [];

		getTenderRound().then(response => {
			this.options.tenderRoundMap = response.data.list.reduce((acc, cur) => {
				if(cur.tenderId <= 1001) return acc;

				let roundId = `${cur.tenderId}${String(cur.round).padStart(3, '0')}`;
				if(cur.zipCodeSpec != 0) roundId += `${cur.zipCodeSpec}`;

				let name = `${cur.tenderName}`;
				if(cur.title.length != 0) name += `_${cur.title}`;

				acc[roundId] = { 
					id: cur.id,
					name, 
					tenderId: cur.tenderId, 
					isMain: cur.zipCodeSpec == 0,
					zipCode: cur.zipCodeSpec == 0 ? cur.zipCode : cur.zipCodeSpec, 
					roundStart: cur.roundStart, 
					roundEnd: cur.roundEnd
				};
				return acc;
			}, {});

			if(Object.keys(this.options.tenderRoundMap).length > 0) {
				if(!Object.keys(this.options.tenderRoundMap).includes(String(this.listQuery.tenderRound))) {
					this.listQuery.tenderRound = this.$route.query.surveyId = Number(Object.keys(this.options.tenderRoundMap)[0]);
				}
			}
			if(Object.keys(this.options.tenderRoundMap).length == 0) {
				this.options.tenderRoundMap = { "-1": { id: -1 }};
				this.listQuery.tenderRound = -1;
			}
		});
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
		showImg(row, prop) {
			const otherProp = ['ImgZoomIn', 'ImgZoomOut'].filter(imgType => imgType != prop)[0];
			this.imgUrls = [ row[prop], row[otherProp] ];
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
		showMapViewer(row, isPoint=false) {
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
				"geometry": isPoint? row.CenterPt : row.Geometry
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

			const depth = row.Geometry.type == "MultiLineString" ? 1 : 2;
			const paths = row.Geometry.coordinates.flat(depth).map(point => ({ lat: point[1], lng: point[0] }));
			const bounds = new google.maps.LatLngBounds();
			paths.forEach(position => bounds.extend(position));
			this.map.fitBounds(bounds);

			const zoom = this.map.getZoom();
			this.map.setZoom(zoom < 21 ? 21 : zoom);
		},
		getList() {
			this.loading = true;
			this.list = [];
			this.caseInfo = {};
			const tenderRound = this.options.tenderRoundMap[this.listQuery.tenderRound];
			this.listQuery.caseType.forEach(typeArr => typeArr[1] = this.typeLevel[typeArr[0]]);

			getCaseTrackingList({
				filter: this.listQuery.filter,
				surveyId: tenderRound.id,
				caseType: JSON.stringify(this.listQuery.caseType),
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
					this.caseInfo = response.data.caseInfo;
					this.total = response.data.total;
					this.list = response.data.list;
					this.list.forEach(l => {
						l.DateCreate = this.formatTime(l.DateCreate);
						this.$set(l, "DeviceTypePlus", Number(`${l.DeviceType}${l.RestoredType}`));
						l.MillingLength = Math.round(l.MillingLength * 100) / 100;
						l.MillingWidth = Math.round(l.MillingWidth * 100) / 100;
						l.MillingArea = Math.round(l.MillingArea * 100) / 100;
						this.$set(l, "editFormula", l.MillingFormula != '0');
					})

					this.$nextTick(() => document.documentElement.scrollTop = this.scrollTop);
				}
				this.getImportCaseList();
				this.loading = false;
			}).catch(err => this.loading = false);
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
		setResult(row, result) {
			this.$confirm(`確定提交?`, "確認", { showClose: false }).then(() => {
				this.loading = true;
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
						this.dialogEditVisible = false;
					} 
				}).catch(err => {
					console.log(err);
					this.getList();
				})
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
		formatter(row, column) {
			if (["DistressType"].includes(column.property)) return this.options.DistressType[row.DistressType];
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