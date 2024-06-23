<template>
	<div class="app-container inspection-progress" v-loading="loading">
		<h2>坑洞缺失</h2>
		<!-- 搜尋 -->
		<div class="filter-container">
			<el-select v-model="listQuery.contractId" placeholder="請選擇" style="width: 110px;">
        <el-option label="全部" :value="99" />
				<el-option v-for="(text, id) in team" :key="`contractId${id}`" :label="text" :value="Number(id)" />
			</el-select>
			
			<el-date-picker
				style="margin-left: 10px;"
				v-model="listQuery.dateRange"
				type="daterange"
				range-separator="至"
				start-placeholder="開始日期"
				end-placeholder="結束日期">
			</el-date-picker>
			<el-button size="small" class="filter-item" type="primary" icon="el-icon-search" @click="getList()" style="margin-left: 10px;">搜尋</el-button>
		</div>

		<!-- 資料列表 -->
		<el-table ref="multipleTable" empty-text="目前沒有資料" :data="list" border fit :header-cell-style="{ 'background-color': '#F2F6FC' }" style="width: 100%">
			<el-table-column 
				v-for="(value, key) in headers" 
				:key="key" :prop="key" 
				:label="value.name" 
				align="center" 
				:sortable="value.sortable"
				:width="value.width"
			>
			</el-table-column>
			<el-table-column
				prop="imgZoomIn"
				label="圖片"
				align="center"
			>
				<template slot-scope="scope">
					<div class="demo-image__preview">
						<el-image
							:src="scope.row.ImgZoomIn"
							:preview-src-list="[scope.row.ImgZoomIn]"
							fit="cover"></el-image>
					</div>
				</template>
			</el-table-column>
		</el-table>

		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" />
    
	</div>
</template>

<script>
import moment from "moment";
import { getPothole, getAllPothole, getInspectionCase } from "@/api/car";
import TimePicker from '@/components/TimePicker';
import Pagination from "@/components/Pagination";
import commonMixin from '@/mixins/common';

export default {
	mixins: [commonMixin],
	name: "caseListLog",
	components: { TimePicker, Pagination },
	data() {
	return {
		loading: false,
		dialogMapVisible: true,
		csvVisible: false,
		csvResultVisible: false,
		file: null,
		timeTabId: 1,
		total: 0,
		imgUrl: [],
		successMap: [],
		failMap: [],
		// dateRange: [ moment().startOf("week").add(1, 'day').toDate(), moment().endOf("week").add(1, 'day').toDate() ],
		listQuery: {
			filterType: 1,
      contractId: 1,
			dateRange: [],
			pageCurrent: 1,
			pageSize: 50
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
    team: {
      1: '第一分隊',
      2: '第二分隊',
      3: '第三分隊',
      4: '第四分隊',
      5: '第五分隊',
      6: '第六分隊'
    },
		distressLevelMap: {
			1: '輕',
			2: '中',
			3: '重'
		},
		list:[],
		rowActive: {},
		headers: {
			SerialNo: {
        name: '缺失Id',
        sortable: false,
      },
      DistressLevel: {
        name: '缺失程度',
        sortable: false,
      },
      MillingLength: {
        name: '預估長',
        sortable: false,
      },
      MillingWidth: {
        name: '預估寬',
        sortable: false,
      },
			DateCreate: {
				name: '創建時間',
				sortable: false,
			},
      Place: {
        name: '地址',
        sortable: false,
      },
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
	created() {},
	mounted() {},
	methods: {
		formatTime(time) {
			return time ? moment(time).format("YYYY/MM/DD") : "";
		},
		getList() {
			this.loading = true;
			const [ timeStart, timeEnd ] = this.listQuery.dateRange;
			const formattedTimeStart = this.formatTime(timeStart);
			const formattedTimeEnd = this.formatTime(timeEnd);

			if (this.listQuery.contractId == 99) {
				// 顯示全部 有6個分隊(6個標)
				getAllPothole({
					timeStart: formattedTimeStart,
					timeEnd: formattedTimeEnd,
					pageCurrent: this.listQuery.pageCurrent,
					pageSize: this.listQuery.pageSize
				}).then(response => {
					this.total = response.data.total;
					this.list = response.data.list;
					
					response.data.list.map(item => {
						item.DistressLevel = this.distressLevelMap[item.DistressLevel];
						item.DateCreate = this.formatTime(item.DateCreate);
						item.MillingLength = Math.round(item.MillingLength * 100) / 100;
						item.MillingWidth = Math.round(item.MillingWidth * 100) / 100;
					});
					
					this.loading = false;
				}).catch(err => { this.loading = false });
				
			} else {
				// 只顯示其中一個分隊
				getPothole({
					contractId: this.listQuery.contractId,
					timeStart: formattedTimeStart,
					timeEnd: formattedTimeEnd,
					pageCurrent: this.listQuery.pageCurrent,
					pageSize: this.listQuery.pageSize,
				}).then(response => {
					this.total = response.data.total;
					this.list = response.data.list;
					this.list.map(item => {
						item.DistressLevel = this.distressLevelMap[item.DistressLevel];
						item.DateCreate = this.formatTime(item.DateCreate);
						item.MillingLength = Math.round(item.MillingLength * 100) / 100;
						item.MillingWidth = Math.round(item.MillingWidth * 100) / 100;
					});

					this.loading = false;
				}).catch(err => { this.loading = false });
			}
		}
	}
};
</script>

<style lang="sass">
.inspection-progress
	.el-table
		.success-row
			background: #f0f9eb
		.warning-row
			background: oldlace
	.dialog-footer
		display: flex
		justify-content: center
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
