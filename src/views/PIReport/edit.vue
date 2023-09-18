<template>
	<div class="app-container perfReport-Edit" v-loading="loading">
		<h2>{{ options.reportTypeMap[listQuery.reportType].name }} - 編輯
			<!-- <el-button type="info" icon="el-icon-refresh-left" size="mini" style="margin-left: 5px;" @click="handlePageTurn()" /> -->
		</h2>
		<aside>{{ options.districtList[reportInfo.zipCode].name }} 
			<span v-if="listQuery.reportType == 1">({{ reportInfo.reportDateEnd }})</span>
			<span v-else-if="listQuery.reportType == 2">({{ reportInfo.reportDateStart }} ~ {{ reportInfo.reportDateEnd }})</span>
		</aside>
		<el-table 
			:data="list"
			empty-text="目前沒有資料"
			border
			fit
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			:row-class-name = "({ row, _ }) => ( row.perfAtt == 0 ? 'item-main' : '' )"
			style="width: 100%"
		>
			<el-table-column type="index" label="序號" width="60" align="center" />
			<el-table-column label="項目" width="200" align="center">
				<template slot-scope="{ row }">
					{{ formatItem(row) }}
				</template>
			</el-table-column>
			<el-table-column label="說明" align="center">
				<template slot-scope="{ row }">
					{{ getDescription(row) }}
				</template>
			</el-table-column>
			<el-table-column label="頁數" align="center">
				<template slot-scope="{ row }">
					{{ row.pageCount ? row.pageCount : "-" }}
				</template>
			</el-table-column>
			<el-table-column label="完成" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.IsFinished" style="color: #67C23A"> V </span>
					<span v-else style="color: #F56C6C"> X </span>
				</template>
			</el-table-column>
			<el-table-column label="動作" width="100" align="center">
				<template slot-scope="{ row }">
					<el-button type="success" plain size="mini" :disabled="editDisabled(row)" @click="beforeEdit(row)"><i class="el-icon-edit"></i>編輯</el-button>
				</template>
			</el-table-column>
		</el-table>
	</div>
</template>

<script>
import moment from "moment";
import { getPerfReportList } from "@/api/PI";

export default {
	name: "perfReportEdit",
	components: { },
	data() {
		return {
			loading: false,
			listQuery: {
				reportId: 0,
				reportType: 1
			},
			reportInfo: {
				zipCode: 104
			},
			list:[],
			options: {
				districtList: {
					// 100: {
					// 	"name": "中正區"
					// },
					103: {
						"name": "大同區"
					},
					104: {
						"name": "中山區"
					},
					// 105: {
					// 	"name": "松山區"
					// },
					// 106: {
					// 	"name": "大安區"
					// },
					// 108: {
					// 	"name": "萬華區"
					// },
					// 110: {
					// 	"name": "信義區"
					// },
					// 111: {
					// 	"name": "士林區"
					// },
					// 112: {
					// 	"name": "北投區"
					// },
					// 114: {
					// 	"name": "內湖區"
					// },
					// 115: {
					// 	"name": "南港區"
					// },
					// 116: {
					// 	"name": "文山區"
					// }
				},
				reportTypeMap: {
					1: {
						name: "日報表",
						path: "daily"
					},
					2: {
						name: "週報表",
						path: "weekly" 
					},
					3: {
						name: "月報表",
						path: "monthly"
					}
				},
				itemMap:{
					// 日報表
					201:{
						0: {
							name: "PI2.1",
							description: "登錄「道路管理資訊系統」資料之即時性",
							path: "/PIReport/daily/PI2_1"
						},
						1: {
							name: "PI2.1附件",
							description: "廠商每天通報數資訊 & 登錄資料數量",
							path: "/PIReport/daily/PI2_1_Att_1"
						},
						2: {
							name: "PI2.1附件2",
							description: "當日被通報案件 & 廠商判定不合理案件",
							path: "/PIReport/daily/PI2_1_Att_2"
						},
					},
					301:{
						0: {
							name: "PI3.1",
							description: "執行巡查與維護工作之安全性",
							path: "/PIReport/daily/PI3_1"
						},
						1: {
							name: "PI3.1附件",
							description: "廠商每日完成自主檢查資訊",
							path: "/PIReport/daily/PI3_1_Att_1"
						},
					},
					// 週報表
					202: {
						0: {
							name: "PI2.2",
							description: "登錄「道路管理資訊系統」資料之正確性",
							path: "/PIReport/weekly/PI2_2"
						},
						1: {
							name: "PI2.2附件",
							description: "正確判定處理原則(放入觀察區與查報區)之案件",
							path: "/PIReport/weekly/PI2_2_Att_1"
						},
						2: {
							name: "PI2.2附件2",
							description: "當週被通報案件",
							path: "/PIReport/weekly/PI2_2_Att_2"
						},
						3: {
							name: "PI2.2附件3",
							description: "機關或監造抽查檢核後發現錯誤的案件敷",
							path: "/PIReport/weekly/PI2_2_Att_3"
						}
					},
					302: {
						0: {
							name: "PI3.2",
							description: "執行維護工作之時效性",
							path: "/PIReport/weekly/PI3_2"
						},
						1: {
							name: "PI3.2附件",
							description: "滿足各項契約時間要求之案件列表",
							path: "/PIReport/weekly/PI3_2_Att_1"
						},
						2: {
							name: "PI3.2附件2",
							description: "滿足各項契約時間要求之案件",
							path: "/PIReport/weekly/PI3_2_Att_2"
						}
					},
					401: {
						0: {
							name: "PI4.1",
							description: "完成維護結果之技術性",
							path: "/PIReport/weekly/PI4_1"
						},
						1: {
							name: "PI4.1附件",
							description: "維護後滿足缺失查報標準之案件",
							path: "/PIReport/weekly/PI4_1_Att_1"
						}
					},
				},
			}
		};
	},
	computed: { },
	watch: {},
	created() {
		this.listQuery.reportType = this.$route.meta.reportType;

		if(this.$route.query.reportId) {
			this.listQuery.reportId = this.$route.query.reportId;
			this.getList();
		} else {
			const path = this.options.reportTypeMap[this.listQuery.reportType].path;
			this.$router.push({ path: `/PIReport/${path}/list` });
		}
	},
	mounted() { },
	methods: {
		editDisabled(row) {
			if(row.perfItem == 302 && row.perfAtt == 2) return row.perfPages == 0;
			return false;
		},
		getList(){
			this.loading = true;
			this.list = [];
			
			getPerfReportList({
				reportId: this.listQuery.reportId
			}).then((response) => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.list = response.data.list;
					this.list.sort((a,b) => a.perfItem - b.perfItem || a.perfAtt - b.perfAtt || a.perfPages - b.perfPages);
					this.reportInfo = response.data.reportInfo;
					if(this.listQuery.reportType == 2) {
						this.reportInfo.reportDateStart = moment(this.reportInfo.reportDate).day() == 0 
							? moment(this.reportInfo.reportDate).day(-6).format("YYYY-MM-DD") 
							: moment(this.reportInfo.reportDate).day(1).format("YYYY-MM-DD");
						if(moment(this.reportInfo.reportDateStart).month() != moment(this.reportInfo.reportDate).month()) this.reportInfo.reportDateStart = moment(this.reportInfo.reportDate).startOf('month').format("YYYY-MM-DD");
					} else if(this.listQuery.reportType == 3) {
						this.reportInfo.reportDateStart = moment(this.reportInfo.reportDate).startOf('month').format("YYYY-MM-DD");
					}
					this.reportInfo.reportDateEnd = moment(this.reportInfo.reportDate).format("YYYY-MM-DD");
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		formatItem(row) {
			let item = this.options.itemMap[row.perfItem]?.[row.perfAtt];
			return item ? item.name + (row.perfPages > 0 ? ` (${row.perfPages})` : "") : "";
		},
		getDescription(row){
			const item = this.options.itemMap[row.perfItem]?.[row.perfAtt];
			return item ? item.description + (row.caseNumber ? ` \n(案件編號: ${row.caseNumber})` : "") : "";
		},
		beforeEdit(row) {
			const item = this.options.itemMap[row.perfItem]?.[row.perfAtt];

			if (item) {
				this.$router.push({ path: item.path, query: { reportId: this.listQuery.reportId, contentId: row.id, perfPages: row.perfPages, cidList: this.list.map(l => l.id).join(",") } });
			}
		},
		handlePageTurn() {
			this.$router.push({
				path: "/PIReport/daily/list",
			})
		}
	}
};
</script>

<style lang="sass">
.perfReport-Edit
	.el-table
		.cell
			white-space: pre-line
		.item-main
			background-color: #F5F5F5
</style>