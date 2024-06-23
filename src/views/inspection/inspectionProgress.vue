<template>
	<div class="app-container inspection-progress" v-loading="loading">
		<h2>巡查歷程</h2>
		<!-- 搜尋 -->
		<div class="filter-container">
			<div class="filter-item">
				<el-select v-model="listQuery.filterType" popper-class="type-select" :disabled="Object.keys(options.tenderRoundMap).length == 0">
					<el-option label="行政區" :value="1" />
					<el-option label="合約" :value="2" />
				</el-select>
				<el-select v-if="listQuery.filterType == 1" v-model.number="listQuery.ZipCode" placeholder="請選擇" popper-class="type-select" style="width: 100px">
					<el-option v-for="zip in options.districtOrder.filter(zip => zip != 1001)" :key="zip" :label="options.districtMap[zip].district" :value="Number(zip)" />
				</el-select>
				<el-select v-if="listQuery.filterType == 2" v-model.number="listQuery.tenderRound" class="tender-select" popper-class="type-select tender">
					<el-option v-for="(val, type) in options.tenderRoundMap" :key="type" :label="val.name" :value="Number(type)">
						<div :style="`color: #${Math.floor(val.tenderId * 16777215).toString(16).substr(0, 8)}`">{{ val.name }}</div>
					</el-option>
				</el-select>
			</div>
			<div v-if="listQuery.filterType != 2" class="filter-item">
				<div style="font-size: 12px; color: #909399">收取日</div>
				<time-picker class="filter-item" :shortcutType="'year'" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList"/>
			</div>
			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList()">搜尋</el-button>
		</div>

		<!-- 資料列表 -->
		<el-table ref="multipleTable" empty-text="目前沒有資料" :data="list" border fit :header-cell-style="{ 'background-color': '#F2F6FC' }" style="width: 100%">
			<el-table-column 
				v-for="(value, key) in headers" 
				:key="key" :prop="key" 
				:label="value.name" 
				:width="key == 'InspectId' ? 60 : ['ZipCode', 'DateCollect_At'].includes(key) ? 140 : null"
				align="center" 
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column }">
					<span v-if="['State'].includes(column.property)">
						<span v-if="row.DateCompleted_At">
							{{ row.DateCompleted_With_Name }} 於 {{ formatTime(row.DateCompleted_At)}} 備註完成
						</span>
						<span v-else-if="row.Duty_with">
							{{ row.Duty_with_Name }} 標記中
						</span>
						<el-button v-if="!row.DateCompleted_At" class="btn-action" type="primary" plain size="mini" round @click="showMap(row)">標記</el-button>
						<el-button v-if="checkPermission(['inspection.marker']) && row.DateCompleted_At" type="danger" size="mini" round plain @click="showDialog(row, -1)">撤銷</el-button>
					</span>
					<span v-else-if="['DateCollect_At'].includes(column.property)">
						<span>{{ formatTime(row[column.property]) }}</span>
					</span>
					<span v-else-if="['SurveyId'].includes(column.property)">
						<span v-if="row.isEdit">
							<el-select v-model.number="row.tenderRound" class="tender-select" popper-class="type-select tender" size="mini" clearable>
								<el-option v-for="(val, type) in options.tenderRoundMap" :key="type" :label="val.name" :value="Number(type)" />
							</el-select>
							<el-button v-if="row.isEdit" style="padding: 5px 5px" type="info" size="mini" @click="row.isEdit = false;">取消</el-button>
							<el-button v-if="row.isEdit" style="padding: 5px 5px" type="primary" size="mini" @click="setResult(row, 0)">確定</el-button>				
						</span>
						<span v-else>
							<span>{{ options.tenderRoundMap[row.tenderRound] ? options.tenderRoundMap[row.tenderRound].name : "-" }}</span>
							<el-button type="text" style="margin-left: 10px" size="mini" @click="row.isEdit = true">
								<i class="el-icon-edit" />
							</el-button>
						</span>
					</span>
					<span v-else-if="['Notes'].includes(column.property)">
						<span v-if="row.isEdit">
							<el-input v-model="row.Notes" size="mini" style="width: 150px"></el-input>
							<el-button v-if="row.isEdit" style="padding: 5px 5px" type="info" size="mini" @click="row.isEdit = false;">取消</el-button>
							<el-button v-if="row.isEdit" style="padding: 5px 5px" type="primary" size="mini" @click="setResult(row, 0)">確定</el-button>				
						</span>
						<span v-else>
							<span>{{ row[column.property] }}</span>
							<el-button type="text" style="margin-left: 10px" size="mini" @click="row.isEdit = true">
								<i class="el-icon-edit" />
							</el-button>
						</span>
					</span>
					<span v-else-if="['ZipCode'].includes(column.property)">
						<span>{{ GetAreaName(row.ZipCode).area }}</span>
					</span>
					<span v-else>
					<span>{{ row[column.property] || "-" }}</span>
					</span>
				</template>
			</el-table-column>
			<el-table-column v-if="checkPermission(['inspection.marker'])" label="操作" align="center" width="180">
				<template slot-scope="{ row }">
					<el-button-group>
						<!-- <el-button v-if="!row.DateCompleted_At" class="btn-action" type="primary" plain size="mini" round @click="showMap(row)">檢視</el-button> -->
						<el-button class="btn-action" type="info" plain size="mini" round @click="showList(row)">列表</el-button>
						<el-button v-if="!row.DateCompleted_At" type="success" size="mini" round @click="showDialog(row, 2)">完成</el-button>
					</el-button-group>
				</template>
			</el-table-column>
		</el-table>

		<!-- 確認 對話框 -->
		<el-dialog title="確認" :visible.sync="dialogVisible" width="400px">
			<span>是否確定
				<span v-if="rowActive.state == -1" style="color: #F56C6C">撤銷</span>
				<span v-else-if="rowActive.state == 2" style="color: #409EFF">提交</span> 完成?
			</span>
			<span slot="footer" class="dialog-footer">
				<el-button @click="dialogVisible = false">取消</el-button>
				<el-button type="primary" @click="dialogVisible = false; setResult(rowActive, rowActive.state);">確定</el-button>
			</span>
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import { getTenderRound, getDistMap } from "@/api/type";
import { getInspectionList, setInspectionList } from "@/api/inspection";
import checkPermission from '@/utils/permission';
import TimePicker from '@/components/TimePicker';
import commonMixin from '@/mixins/common'

export default {
	mixins: [commonMixin],
	name: "inspectionProgress",
	components: { TimePicker },
	data() {
	return {
		loading: false,
		dialogMapVisible: true,
		timeTabId: 1,
		dateRange: [ moment().startOf("week").add(1, 'day').toDate(), moment().endOf("week").add(1, 'day').toDate() ],
		listQuery: {
			filterType: 1,
			ZipCode: 0,
			tenderRound: 0
		},
		area:{
			0: "全部",
			100: '中正區',
			103: '大同區',
			104: '中山區',
			105: '松山區',
			106: '大安區',
			108: '萬華區',
			110: '信義區',
			111: '士林區',
			112: '北投區',
			114: '內湖區',
			115: '南港區',
			116: '文山區',
			999: '橋涵區'
		},
		list:[],
		rowActive: {},
		headers:{
			InspectId:{
				name:'編號',
				sortable: false,
			},
			ZipCode:{
				name:'行政區',
				sortable: false,
			},
			DateCollect_At:{
				name:'收取日',
				sortable: false,
			},
			SurveyId: {
				name:'合約',
				sortable: false,
			},
			Notes:{
				name:'備註',
				sortable: false,
			},
			State:{
				name:'狀態',
				sortable: false,
			}
		},
		dialogVisible: false,
		InputNotes:'',
		options: {
			tenderRoundMap: {},
			districtMap: {},
			districtOrder: [],
		}
	};
	},
	computed: {},
	watch: {},
	created() {
		getTenderRound().then(response => {
			this.options.tenderRoundMap = response.data.list.reduce((acc, cur) => {
				if(cur.tenderId <= 1001) return acc;

				let roundId = `${cur.tenderId}${String(cur.round).padStart(3, '0')}`;
				if(cur.zipCodeSpec != 0) roundId += `${cur.zipCodeSpec}`;

				let name = `${cur.tenderName.replace("年度", "")}`;
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
				if(!Object.keys(this.options.tenderRoundMap).includes(String(this.listQuery.tenderRound))) this.listQuery.tenderRound = Number(Object.keys(this.options.tenderRoundMap)[0]);
			}
			if(Object.keys(this.options.tenderRoundMap).length == 0) {
				this.options.tenderRoundMap = { "-1": { id: -1 }};
				this.listQuery.tenderRound = -1;
			}
		});

		getDistMap().then(response => {
			this.$set(this.options.districtMap, '0', { district: '全部'	});
			this.options.districtOrder.push('0');

			Object.keys(response.data.districtMap).filter(key => key < 1000).forEach(key => {
				this.$set(this.options.districtMap, key, response.data.districtMap[key]);
				this.options.districtOrder.push(key);
			});
		});
	},
	mounted() {},
	methods: {
		checkPermission,
		showMap(row) {
			this.setResult(row, 1).then(() => {
				this.$router.push({
					path: "/inspection/caseMark",
					query: { inspectId: row.InspectId },
				});
			})
		},
		showList(row) {
			this.$router.push({
				path: "/inspection/caseMarkList",
				query: { caseInspectId: row.InspectId },
			});
		},
		formatTime(time) {
			return time ? moment(time).format("YYYY/MM/DD") : "";
		},
		getList(){
			const tenderRound = this.options.tenderRoundMap[this.listQuery.tenderRound];

			if ((this.listQuery.ZipCode != 0 && !Number(this.listQuery.ZipCode) ) || tenderRound ==  undefined) {
				this.$message({
					message: "請選擇行政區",
					type: "error",
				});
			} else {
				this.loading = true;
				let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
				let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
				this.searchRange = startDate + " - " + endDate;
				this.list = [];

				getInspectionList({
					zipCode: this.listQuery.filterType == 1 ? this.listQuery.ZipCode : null,
					surveyId: this.listQuery.filterType == 2 ? tenderRound.id : null,
					timeStart: this.listQuery.filterType != 2 ? startDate : null,
					timeEnd: this.listQuery.filterType != 2 ? moment(endDate).add(1, "d").format("YYYY-MM-DD") : null
				}).then(response => {
					if (response.data.list.length == 0) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
					} else {
						this.list = response.data.list;
						this.list.forEach((l)=>{
							this.$set(l, "isEdit", false);
							const tenderRound = l.SurveyId
								? Object.keys(this.options.tenderRoundMap).filter(key => this.options.tenderRoundMap[key].id == l.SurveyId)[0]
								: 0;
							this.$set(l, "tenderRound", Number(tenderRound) || null);
						})
					}
					this.loading = false;
				}).catch(err => {this.loading = false});
			}
		},
		showDialog(row, state){
			this.dialogVisible=true;
			this.rowActive = JSON.parse(JSON.stringify(row));
			this.$set(this.rowActive, "state", state);
		},
		async setResult(row, state = 0) {
			return new Promise(resolve => {
				row.isEdit = false;
				const tenderRound = this.options.tenderRoundMap[row.tenderRound];

				setInspectionList(row.InspectId, {
					state,
					surveyId: tenderRound ? tenderRound.id : 0,
					notes: row.Notes,
				}).then(response => {
					if ( response.statusCode == 20000 ) {
						this.$message({
							message: "提交成功",
							type: "success",
						});
						this.getList();
						resolve();
					} 
				}).catch(err => {
					// console.log(err);
					this.getList();
				})
			})
		}
	}
};
</script>

<style lang="sass">
.inspection-progress
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
			.el-select:first-child .el-input__inner
				background-color: #F5F7FA
				color: #909399
				border-right: none
				border-top-right-radius: 0
				border-bottom-right-radius: 0
				&:focus
					border-color: #DCDFE6
			.el-select:last-child .el-input__inner
				border-top-left-radius: 0
				border-bottom-left-radius: 0
				padding-left: 10px
				text-align: left
			.el-select.tender-select
				width: 240px
				.el-input__inner
					padding-left: 8px
					padding-right: 10px
					text-align: left
				.el-input__suffix
					right: 0
					margin-right: -3px
					transform: scale(0.7)
</style>
