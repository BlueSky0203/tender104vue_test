<template>
	<div class="case-detail-V0">
		<el-table
			:loading="loading"
			empty-text="目前沒有資料"
			:data="detail"
			border
			fit
			highlight-current-row
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			stripe
			style="width: 100%"
		>
			<el-table-column label="欄位" prop="column" min-width="50" align="center" />
			<el-table-column label="內容" prop="content" min-width="100" align="center">
				<template slot-scope="{ row, column }">
					<span v-if="String(row[column.property]).match(/.JPG|.jpg|.Jpg/g)">
						<el-link v-if="row[column.property].includes('road')" :href="`https:/rm.bim-group.com/${row[column.property]}`" target="_blank">圖片連結</el-link>
						<el-link v-else :href="`https:/rm.bim-group.com/pic/${row[column.property]}`" target="_blank">圖片連結</el-link>
					</span>
					<span v-else>
						<span>{{ row[column.property] || "-" }}</span>
					</span>
				</template>
			</el-table-column>
		</el-table>
	</div>
</template>

<script>
import { getCaseDetailV0 } from "@/api/dispatchV0";

export default {
	name: "caseDetailV0",
	props: {
		loading: {
			required: true,
			type: Boolean
		},
		showDetailDialog: {
			required: true,
			type: Boolean
		},
	},
	data() {
		return {
			headersDetail: {
				casetype: "查報來源",
				SerialNo: "系統編號",
				CaseSN: "申請單號",
				paperkind: "申請單類別",
				run1tflag: "申請單流程",
				TBName: "區別",
				lining: "里別",
				succ: "通報單號",
				CaseNo: "案件編號",
				CaseDate: "成案日期",
				reporter: "查報人員",
				CaseName: "案件地點",
				CaseStatus: "案件類型",
				CaseProcess: "案件流程",
				acsum0: "預估面積",
				delmuch0: "預估刨鋪深度",
				delmuch: "實際刨鋪深度",
				position: "案件位置",
				PicPath1: "施工前近照",
				PicPath3: "施工前遠照"
			},
			detail: [],
			options: {
				RoadType: {
					1: "道路",
					2: "設施",
					3: "橋涵"
				},
				BrokeType: {
					1: "輕度",
					2: "中度",
					3: "重度"
				},
				paperkind: {
					1: "銑鋪申請單",
					2: "設施申請單",
					3: "標線申請單",
					4: "坑洞臨補單",
					5: "分隊交辦案件",
					6: "塗佈申請單"
				},
				run1tflag: {
					0: "未送件",
					"s": "未印申請單",
					"a": "組長審核",
					"b": "主任審核",
					"c": "主任抽件",
					"d": "監造應送分隊",
					"e": "分隊審核",
					"f": "隊部審核",
					"g": "分隊回公司審核",
					1: "分隊抽件",
					2: "隊部抽件",
					3: "分隊交辦",
					4: "已完成申請單"  
				}
			}
		}
	},
	methods: {
		getDetail(row) {
			this.detail = [];

			getCaseDetailV0({ SerialNo: row.SerialNo }).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					const caseObj = response.data.list[0];
					// console.log(caseObj);

					for(const key in this.headersDetail) {
						if(key == 'CaseStatus') this.detail.push({ column: this.headersDetail[key], content: `${this.options.RoadType[caseObj.RoadType]} ${caseObj.DName} ${caseObj.BTName} ${this.options.BrokeType[caseObj.BrokeType]}` });
						else if(key == 'CaseProcess') {
							let content = "";

							// 主任分派
							if(caseObj.CType0 == "0" && ((caseObj.CType4 == "0" || caseObj.CType4 == "8" ) && caseObj.SCType1Flag == "0")) content += "主任未分派、";
							else if (caseObj.CType0 == "1") content += `主任 ${caseObj.CType0date} 已分派、`;

							// 工班施工
							if(caseObj.CType1 == "0" && ((caseObj.CType4 == "0" || caseObj.CType4 == "8" ) && caseObj.SCType1Flag == "0")) content += "工班未派施工、";
							else if (caseObj.CType1 == "1") content += `工班 ${caseObj.CType1date} 已派施工、`;

							// 已報完工
							if(caseObj.CType2 == "0" && ((caseObj.CType4 == "0" || caseObj.CType4 == "8" ) && caseObj.SCType1Flag == "0")) content += "未報完工、";
							else if (caseObj.CType2 == "1") {
								if(caseObj.page4t != null) content += `實際完工日期: ${caseObj.page4t}, 道管完工日期: ${caseObj.CType2date}、`;
								else content += `${caseObj.CType2date} 已報完工、`
							}

							// 坑洞臨補
							if(caseObj.SCType2Flag == "1") content += "坑洞臨補  ";
							else if(caseObj.SCType2Flag == "2") content += "坑洞臨補已完工、";

							// 熱再生
							if(caseObj.CType4 == "1") content += `熱再生主任已分派、`;
							else if(caseObj.CType4 == "2") content += `熱再生 ${caseObj.CType4date} 已派施工、`;
							else if(caseObj.CType4 == "3") content += `熱再生 ${caseObj.CType4date} 已派施工，熱再生 ${caseObj.page4t} 已完工、`;

							content = content.replace(/、$/, "");
							this.detail.push({ column: this.headersDetail[key], content });
						} else if(key == 'position') this.detail.push({ column: this.headersDetail[key], content: `(${caseObj.XX}, ${caseObj.YY})`});
						else if(['paperkind', 'run1tflag'].includes(key)) this.detail.push({ column: this.headersDetail[key], content: this.options[key][caseObj[key]] });
						else this.detail.push({ column: this.headersDetail[key], content: caseObj[key] });
					}
				}
				this.$emit('update:loading', false);
				this.$emit('update:showDetailDialog', true);
			}).catch(err => this.$emit('update:loading', false));
		},
	}
}
</script>

<style>

</style>