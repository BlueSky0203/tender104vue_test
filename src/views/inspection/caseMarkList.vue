<template>
	<div class="app-container case-marker-list" v-loading="loading">
		<h2>標記列表</h2>
		<aside style="white-space: pre-line">
			1. 缺失類型:<br>
				- 「人手孔缺失」 和 「其他」 不能匯入「缺失列表」。<br>
				- 「人孔高差」 不能匯入「追蹤列表」。<br>
			2. 已匯入過的缺失無法編輯。
		</aside>
		<div class="filter-container">
			<div class="filter-item">
				<el-input v-model="listQuery.filterId" placeholder="請輸入">
					<el-select slot="prepend" v-model="listQuery.filterType" popper-class="type-select">
						<el-option label="路線Id" :value="1"></el-option>
						<el-option label="缺失Id" :value="2"></el-option>
						<el-option label="追蹤Id" :value="3"></el-option>
						<el-option label="標記人員" :value="4"></el-option>
					</el-select>
				</el-input>
			</div>
			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="listQuery.pageCurrent = 1; getList();">搜尋</el-button>
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

		<h5 v-if="list.length != 0">總案件：{{ total }}</h5>

		<el-table
			empty-text="目前沒有資料"
			:data="list"
			border
			fit
			highlight-current-row
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			stripe
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
					<span v-else-if="row.isEdit && column.property != 'id'">
						<el-input v-if="['roadDir'].includes(column.property)" class="road-dir" v-model="row.Lane" size="mini">
							<el-select slot="prepend" v-model="row.Direction" popper-class="type-select" size="mini">
								<el-option v-for="(name, id) in options.roadDir" :key="id" :label="name" :value="Number(id)" />
							</el-select>
						</el-input>
						<el-input v-else-if="['TrackingId', 'MillingLength', 'MillingWidth', 'MillingArea' ].includes(column.property)" v-model="row[column.property]" size="mini" @change="calArea(row)" />
						<el-select v-else-if="['DistressType', 'DistressLevel'].includes(column.property)" class="edit-select" v-model.number="row[column.property == 'BrokeStatus' ? 'BrokeType' : column.property]" size="mini" popper-class="type-select">
							<el-option v-for="(name, type) in options[column.property]" :key="`${column.property}_${type}`" :label="name" :value="Number(type)" />
						</el-select>
						<el-date-picker
							v-else-if="['DateReport'].includes(column.property)"
							v-model="row.DateReport"
							type="date"
							placeholder="日期"
							:clearable="false"
							size="mini"
						/>
						<el-input v-else-if="['Place'].includes(column.property)" v-model="row.Place" type="textarea" autosize />
						<el-button type="text" @click="setCaseInfo(row);">
							<i class="el-icon-success" />
						</el-button>
						<el-button type="text" @click="row.edit = false; getList()">
							<i class="el-icon-error" />
						</el-button>
					</span>
					<span v-else>{{ formatter(row, column) }}</span>
				</template>
			</el-table-column>
			<el-table-column label="操作" align="center">
				<template slot-scope="{ row }">
					<el-button-group v-if="!row.isEdit">
						<!-- NOTE:先解除上傳不可編緝的限制 -->
						<!-- <template v-if="!Object.values(importCaseObj).flat().includes(row.id)" > -->
							<el-button v-if="row.IsActive" class="btn-action" type="primary" plain size="mini" round @click="row.isEdit = true">編輯</el-button>
							<el-button v-if="row.IsActive" class="btn-action" type="danger" plain size="mini" round @click="setCaseState(row, 0)">刪除</el-button>
							<el-button v-else-if="!row.IsActive" class="btn-action" type="success" plain size="mini" round @click="setCaseState(row, 1)">復原</el-button>
						<!-- </template> -->
						<el-button class="btn-action" type="info" icon="el-icon-search" plain size="mini" round @click="showMapViewer(row)" />
					</el-button-group>
					<span v-else> - </span>
				</template>
			</el-table-column>
		</el-table>

		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" />

		<el-image-viewer
			v-if="showImgViewer"
			class="img-preview"
			:on-close="() => { showImgViewer = false; }"
			:url-list="imgUrls"
		/>

		<el-dialog
			class="dialog-filter"
			:visible.sync="dialogFilterVisible"
			title="過濾條件"
			width="900px"
			:show-close="false"
			center
		>
			<el-row>
				<el-col :span="6" v-for="distressId in options.distressTypeOrder" :key="distressId" style="display: flex; justify-content: space-between; width: 200px; margin-right: 10px">
					<el-checkbox v-model="checked" :label="distressId">
						{{ options.DistressType[distressId] }} ({{ caseInfo[distressId] || 0 }})
					</el-checkbox>
					<el-select v-model="typeLevel[distressId]" placeholder="請選擇" size="mini" popper-class="type-select" :disabled="!checked.includes(distressId)">
						<el-option v-for="order in [0, 3, 2, 1]" :key="order" :value="order" :label="order == 0 ? '全部' : options.DistressLevel[order]" />
					</el-select>
				</el-col>
			</el-row>

			<span slot="footer" class="dialog-footer">
				<el-button @click="filterCancel">取消</el-button>
				<el-button type="primary" @click="filterConfirm">確定</el-button>
			</span>
		</el-dialog>

		<el-dialog class="dialog-map" :visible.sync="dialogMapVisible" width="600px">
			<map-viewer :map.sync="map"/>
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import { getInspectionCaseList, setInspectionCaseList, getImportCase } from "@/api/inspection";
import Pagination from "@/components/Pagination";
import MapViewer from "@/components/MapViewer";
import ElImageViewer from 'element-ui/packages/image/src/image-viewer';

export default {
	name: "caseMarkerList",
	components: { Pagination, ElImageViewer, MapViewer },
	data() {
		return {
			loading: false,
			isUpload: false,
			showImgViewer: false,
			dialogMapVisible: true,
			dialogFilterVisible: false,
			filterNow: false,
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
				filterId: "",
				filterType: 1,
				caseInspectId: "",
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
				InspectId: {
					name: "路線Id",
					sortable: false,
					width: 70
				},
				TrackingId: {
					name: "追蹤Id",
					sortable: false,
					width: 70
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
				DateReport: {
					name: "通報時間",
					sortable: true,
					width: 160
				},
				Duty_With_Name: {
					name: "標記人員",
					sortable: false,
					width: 80
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
			importCaseObj: {},
			list: [],
			typeLevel: {},
			caseInfo: {},
			headersCheckVal: [],
			allHeaders: true,
			options: {
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
				// pciCaseTypeMap: {
				// 	15: "坑洞",
				// 	29: "縱橫裂縫",
				// 	16: "龜裂",
				// 	32: "車轍",
				// 	18: "隆起與凹陷",
				// 	// 34: "人手孔缺失",
				// 	51: "薄層剝離",
				// 	// 21: "其他",
				// 	50: "塊狀裂縫",
				// 	53: "推擠",
				// 	65: "補綻及管線回填",
				// 	54: "冒油",
				// 	55: "波浪狀鋪面",
				// 	56: "車道與路肩分離",
				// 	49: "滑溜裂縫",
				// 	66: "骨材剝落",
				// 	58: "人孔高差"
				// },
				DistressLevel: {
					// 0: "全部",
					1: "輕",
					2: "中",
					3: "重"
				},
				roadDir: {
					0: "無",
					1: "順",
					2: "逆"
				}
			}
		};
	},
	computed: {
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
					this.listQuery.caseType.push([type, 0]);
					this.$set(this.typeLevel, type, 0);
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
		}
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
	},
	mounted() {
		this.dialogMapVisible = false;

		if (this.$route.query.caseInspectId) {
			this.listQuery.filterType = 1;
			this.listQuery.filterId = this.$route.query.caseInspectId;
			this.getList();
		}
	},
	methods: {
		showImg(row, prop) {
			const otherProp = ['ImgZoomIn', 'ImgZoomOut'].filter(imgType => imgType != prop)[0];
			this.imgUrls = [ row[prop], row[otherProp] ];
			this.showImgViewer = true;
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
				"geometry": row.Geometry
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
		getImportCaseList() {
			this.loading = true;
			this.importCaseObj = [];
			getImportCase().then(response => {
				this.importCaseObj = response.data.caseDetectionIdObj;
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		getList() {
			if(this.listQuery.filterId.length == 0) {
				this.$message({
					message: "請輸入查詢內容",
					type: "error",
				});
			} else {
				this.loading = true;
				this.list = [];
				this.caseInfo = {};
				// this.$router.push({ query: { caseInspectId: this.listQuery.caseInspectId }});
				this.listQuery.caseType.forEach(typeArr => typeArr[1] = this.typeLevel[typeArr[0]]);

				let inspectId = null;
				let caseId = null;
				let trackingId = null;
				let dutyWith = null;

				switch (this.listQuery.filterType) {
					case 1: // 路線Id
						inspectId = this.listQuery.filterId;
						break;
					case 2: // 缺失Id
						caseId = this.listQuery.filterId;
						break;
					case 3: // 追蹤Id
						trackingId = this.listQuery.filterId;
						break;
					case 4: // 標記人員
						dutyWith = this.listQuery.filterId;
						break;
				}

				getInspectionCaseList({
					filter: this.listQuery.filter,
					inspectId: inspectId,
					caseId: caseId,
					trackingId: trackingId,
					dutyWith: dutyWith,
					caseType: JSON.stringify(this.listQuery.caseType),
					pageCurrent: this.listQuery.pageCurrent,
					pageSize: this.listQuery.pageSize
				}).then(response => {
					this.filterNow = this.listQuery.filter;
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
							l.DateReport = this.formatTime(l.DateReport);
							l.MillingLength = Math.round(l.MillingLength * 100) / 100;
							l.MillingWidth = Math.round(l.MillingWidth * 100) / 100;
							l.MillingArea = Math.round(l.MillingArea * 100) / 100;

							this.$set(l, "isEdit", false);
						})

						this.$nextTick(() => document.documentElement.scrollTop = this.scrollTop);
					}
					this.getImportCaseList();
					this.loading = false;
				}).catch(err => this.loading = false);
			}
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
		setCaseInfo(row) {
			this.loading = true;
			this.scrollTop = document.documentElement.scrollTop;

			setInspectionCaseList(row.id, {
				trackingId: row.TrackingId,
				dateReport: this.formatTime(row.DateReport),
				distressType: row.DistressType,
				distressLevel: row.DistressLevel,
				millingLength: row.MillingLength,
				millingWidth: row.MillingWidth,
				millingArea: row.MillingArea,
				place: row.Place,
				direction: row.Direction,
				lane: row.Lane
			}).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "修改成功",
						type: "success",
					});
					this.getList();
				} 
			}).catch(err => {
				console.log(err);
				this.getList();
			})
		},
		setCaseState(row, isActive) {
			this.loading = true;

			setInspectionCaseList(row.id, { isActive }).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: isActive ? "復原成功" : "刪除成功",
						type: "success",
					});
					this.getList();
				} 
			}).catch(err => {
				console.log(err);
				this.getList();
			})
		},
		calArea(row) {
			row.MillingArea = Math.round(row.MillingLength * row.MillingWidth * 100) / 100;
		},
		formatter(row, column) {
			if (["DistressType"].includes(column.property)) return this.options.DistressType[row.DistressType];
			else if (["DistressLevel"].includes(column.property)) return this.options.DistressLevel[row.DistressLevel];
			else if (["roadDir"].includes(column.property)) return `${this.options.roadDir[row.Direction]}-${row.Lane}`;
			else if (!["id", "Id"].includes(column.property) && Number(row[column.property])) return (Math.round(row[column.property] * 100)/100).toLocaleString();
			else return row[column.property] || "-";
		},
		formatTime(time) {
			return moment(time).format("YYYY-MM-DD hh:MM:ss");
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
.case-marker-list
	.filter-container
		.filter-item
			margin-right: 5px
			.el-select
				width: 80px
				.el-input__inner
					padding-left: 8px
					padding-right: 10px
				.el-input__suffix
					right: 0
					margin-right: -3px
					transform: scale(0.7)
	.road-dir, .el-date-editor
		width: 110px
		.el-input-group__prepend .el-select
			width: 40px
		.el-input__inner
			padding: 5px 0 5px 17px
		.el-input__inner
			text-align: center
	.road-dir .el-input__inner
		width: 40px
		padding: 5px 5px 5px 0
	.btn-action
		margin-left: 5px
		padding: 5px
	.img-preview
		width: 100%
		.el-image-viewer__mask
			opacity: 0.7
		.el-icon-circle-close
			color:  #FFF
	.el-icon-success
		margin-right: -10px
	.el-icon-error
		color: #F56C6C
	.dialog-filter
		.el-select
			width: 55px
			margin-top: -5px
			margin-bottom: 10px
			.el-input__inner
				padding: 0 13px 0 5px
				text-align: center
				background-color: transparent
			.el-input__suffix
				right: 0px
				margin-right: -3px
				transform: scale(0.7)
	.dialog-map
		min-height: 300px 
		.el-dialog__body
			height: 30%
</style>