<template>
	<div class="app-container PI4_1" v-loading="loading">
		<h2>PI4.1</h2>

		<el-button v-if="pageTurn[0] != -1" icon="el-icon-arrow-left" size="mini" plain :disabled="pageTurn[0] == -1" @click="handlePageTurn(-1)">PI3-2附件/2</el-button>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn()">週報表</el-button>
		<span> > </span>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn(0)">{{ districtList[inputs.zipCode].name }} ({{ formatDate(reportDate) }})</el-button>
		<el-button v-if="pageTurn[1] != -1" type="primary" icon="el-icon-arrow-right" size="mini" plain :disabled="pageTurn[1] == -1"  @click="handlePageTurn(1)">PI4.1附件</el-button>

		<el-row :gutter="10">
			<el-col :span="12">
				<el-card shadow="never" style="width: 450px; margin: 20px auto; padding: 5px 10px;">
					<el-form :model="inputForm">
						<div style="display:flex;justify-content:space-between;align-items: center">
							<h3>檢核資訊</h3>
							<el-button-group>
								<el-button type="primary" plain icon="el-icon-document" size="small" @click="handleDownload()">輸出</el-button>
								<el-button type="info" icon="el-icon-refresh" size="small" @click="getList()">刷新</el-button>
								<el-button class="filter-item" type="success" icon="el-icon-document" size="small" @click="storeData">儲存</el-button>
							</el-button-group>
						</div>
						<el-divider />
						<el-form-item label="起始頁碼" :label-width="labelWidth1">
							<el-input-number v-model="initPage" controls-position="right" :min="1" @change="setPDFinputs" />
						</el-form-item>
						<el-form-item label="檢查日期" :label-width="labelWidth1">
							<el-date-picker
								v-model="checkDate"
								type="date"
								placeholder="日期"
								:picker-options="pickerOptions"
								:clearable="false"
								style="width: 200px"
								@change="setPDFinputs"
							/>
						</el-form-item>
						<el-divider />
						<el-form-item label="坑洞" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.hole_Num41_AC" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-form-item label="人孔高差" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.sidewalk_Num41_AC" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-form-item label="縱橫向裂縫/龜裂" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.crack_Num41_AC" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-form-item label="車轍/隆起與凹陷" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.uplift_Num41_AC" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-form-item label="人行道(含附屬設施)" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.sidewalk_Num41_FA" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-divider />
						<el-form-item label="未滿足契約要求案件資訊" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.failContractRequire_Num41_AC" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-divider />
						<!-- <el-form-item label="廠商自主檢查人次數" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.companyCheck_Num41" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-divider /> -->
						
						<h4>應檢附文件</h4>
						<el-form-item label="" :label-width="labelWidth2">
							<el-checkbox v-model="inputForm.checkInTime_doc41_AC" @change="setPDFinputs">滿足與未滿足各項契約時間要求資訊</el-checkbox>
							<br/>
							<el-checkbox v-model="inputForm.checkCoFail_doc41_AC" @change="setPDFinputs">廠商自主發現未滿足契約要求案件資訊</el-checkbox>
							<br/>
							<el-checkbox v-model="inputForm.checkSandOFail_doc41_AC" @change="setPDFinputs">機關或監造抽查檢核後發現未滿足要求的案件數資訊</el-checkbox>
							<br/>
							<el-checkbox v-model="inputForm.checkCoUnreason_doc41_AC" @change="setPDFinputs">廠商認為為滿足判定不合理資訊</el-checkbox>
						</el-form-item>
					</el-form>
				</el-card>
			</el-col>
			<el-col :span="12" ref="container" class="container"/>
		</el-row>
	</div>
</template>

<script>
import moment from "moment";
import { generate } from '@pdfme/generator';
import { Form } from '@pdfme/ui';
import { getCaseWarrantyCount, getPerfContent, setPerfContent } from "@/api/PI";

export default {
	name: "PI4_1",
	components: { },
	data() {
		return {
			labelWidth1:'150px',
			labelWidth2:'20px',
			loading: true,
			initPage: 22,
			listQuery: {
				reportId: 0,
				perfContentId: null
			},
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
			},
			checkDate: moment().startOf("d").subtract(1, "d"),
			reportDate: null,
			// list:[],
			districtList: {
				// 100: {
				// 	"name": "中正區"
				// },
				103: {
					"name": "大同區",
					"tenderName": "112年度大同區道路巡查維護修繕成效式契約"
				},
				104: {
					"name": "中山區",
					"tenderName": "111年度中山區道路巡查維護修繕成效式契約"
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
			pageTurn: [-1, -1],
			template: {},
			inputForm: {
				//AC
				// maintainAll_Num41_AC: 0,
				hole_Num41_AC: 0,
				sidewalk_Num41_AC: 0,
				crack_Num41_AC: 0,
				uplift_Num41_AC: 0,
				sidewalk_Num41_FA: 0,
				failContractRequire_Num41_AC: 0,
				companyCheck_Num41_AC: 0,
				BCA_41_AC: 0,
				checkInTime_doc41_AC: true,
				checkCoFail_doc41_AC: true,
				checkSandOFail_doc41_AC: true,
				checkCoUnreason_doc41_AC: true
			},
			inputs: {
				contractName: '111年度中山區道路巡查維護修繕成效式契約',//工程名稱
				serialNumber_AC: '11206250201',//紀錄編號
				companyName: '聖東營造股份有限公司',//施工廠商
				date: '',//檢查日期
				zipCode: '104',
				requiredStandard_41_AC:'維護後應滿足「AC路面缺失訂定查報標準」各項次之技術水準',//要求標準
				requiredStandard_41_FA:'維護後應滿足「設施缺失訂定查報標準」各項次之技術水準',//要求標準
				measurement_41:'廠商每週維護後滿足各項缺失合格標準之總項次數/維護各項缺失之總項次數',//量測方式

				// AC
				maintainAll_Num41_AC: '0',//A
				hole_Num41_AC: '0',
				sidewalk_Num41_AC: '0',
				crack_Num41_AC: '0',
				uplift_Num41_AC: '0',
				sidewalk_Num41_FA: '0',
				sumQualified_Num41_AC: '0',
				failContractRequire_Num41_AC: '0',//C
				companyCheck_Num41_AC: '0',
				BCA_41_AC: '',
				checkInTime_doc41_AC: 'V',
				checkCoFail_doc41_AC: 'V',
				checkSandOFail_doc41_AC: 'V',
				checkCoUnreason_doc41_AC: 'V'
			},
		};
	},
	computed: { },
	watch: {},
	async created() {	
		if(this.$route.query.reportId && this.$route.query.contentId) {
			this.listQuery.reportId = this.$route.query.reportId;
			this.listQuery.perfContentId = this.$route.query.contentId;

			const cidList = this.$route.query.cidList.split(",");
			const pageIndex = cidList.indexOf(String(this.$route.query.contentId));
			this.pageTurn = [ 
				Number(pageIndex) == 0 ? -1 : cidList[pageIndex-1], 
				Number(pageIndex) == cidList.length - 1 ? -1 : cidList[pageIndex+1] 
			];

			this.setData(this.listQuery.perfContentId);
		} else this.$router.push({ path: "/PIReport/weekly/list" });	
	},
	mounted() { },
	methods: {
		async setData(perfContentId, initPage=0) {
			return new Promise(resolve => {
				getPerfContent({
					contentId: perfContentId
				}).then(async (response) => {
					if (response.data.list.length == 0) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
					} else {
						this.list = response.data.list[0];
						if(Object.keys(this.list.content).length != 0) {
							this.inputs = this.list.content.inputs;
							this.initPage = initPage != 0 ? initPage : this.list.content.initPage;
						}
						this.reportDate = this.list.reportDate;
						this.checkDate = this.list.checkDate ? this.list.checkDate : this.list.reportDate;
						this.inputs.zipCode = String(this.list.zipCode);

						await this.initPDF();
					}

					resolve();
					this.loading = false;
				}).catch(err => { this.loading = false; });
			})
		},
		initPDF() {
			return new Promise(resolve => {
				fetch(`/assets/pdf/weekly/PI4_1-Main.json?t=${Date.now()}`).then(async (response) => {
					const domContainer = this.$refs.container.$el;
					this.template = await response.json();

					const font = {
						edukai: {
							data: await fetch('/assets/font/edukai-4.0.ttf').then(res => res.arrayBuffer()),
							fallback: true
						}
					};

					const changeInput = (arg) => {
						// console.log(arg);
						if([`checkInTime_doc41_AC`, `checkCoFail_doc41_AC`, `checkSandOFail_doc41_AC`, `checkCoUnreason_doc41_AC`].includes(arg.key)) this.inputForm[arg.key] = (arg.value == 'V' || arg.value == 'v');
						if([`maintainAll_Num41_AC`, `hole_Num41_AC`, `sidewalk_Num41_AC`, `crack_Num41_AC`, `uplift_Num41_AC`, `sidewalk_Num41_FA`, `failContractRequire_Num41_AC`, `companyCheck_Num41_AC`].includes(arg.key)) this.inputForm[arg.key] = parseInt(arg.value);
						this.setPDFinputs();
					}

					this.form = new Form({ domContainer, template: this.template, inputs: [ this.inputs ], options: { font } });
					this.form.onChangeInput(arg => changeInput(arg));
					for(const [key, value] of Object.entries(this.inputs)) changeInput({ key, value });
					if(Object.keys(this.list.content).length == 0) this.getList();
					else this.setPDFinputs();

					resolve();
				})
			})
		},
		setPDFinputs() {
			//工程名稱
			const reportDate = moment(this.reportDate).format("YYYY/MM/DD").split("/");
			reportDate[0] = Number(reportDate[0]) - 1911;
			this.inputs.contractName = this.districtList[this.inputs.zipCode].tenderName;
			//紀錄編號
			this.inputs.serialNumber_AC = reportDate.join("") + "02" + String(this.initPage).padStart(2, '0');	
			//檢查日期
			const checkDate = moment(this.checkDate).format("YYYY/MM/DD").split("/");
			checkDate[0] = Number(checkDate[0]) - 1911;
			this.inputs.date = `${checkDate[0]}年${checkDate[1]}月${checkDate[2]}日`;
			//缺失次數
			for(const key of ['hole_Num41_AC', 'sidewalk_Num41_AC', 'crack_Num41_AC', 'uplift_Num41_AC', 'sidewalk_Num41_FA', 'failContractRequire_Num41_AC', 'companyCheck_Num41_AC']) {
				this.inputs[key] = String(this.inputForm[key]);
			}
			//計算(B)
			this.inputs.sumQualified_Num41_AC = String(this.inputForm.hole_Num41_AC+this.inputForm.sidewalk_Num41_AC+this.inputForm.crack_Num41_AC+this.inputForm.uplift_Num41_AC+this.inputForm.sidewalk_Num41_FA);
			//(A)=(B) && 廠商自主檢查件數 = (A)
			this.inputs.maintainAll_Num41_AC = this.inputs.companyCheck_Num41_AC = this.inputs.sumQualified_Num41_AC;

			//計算指標數值
			const A = this.inputs.maintainAll_Num41_AC;
			const B = this.inputForm.hole_Num41_AC+this.inputForm.sidewalk_Num41_AC+this.inputForm.crack_Num41_AC+this.inputForm.uplift_Num41_AC+this.inputForm.sidewalk_Num41_FA;
			const C = this.inputForm.failContractRequire_Num41_AC;
			if(A==0) this.inputs.BCA_41_AC = '';
			else this.inputs.BCA_41_AC = String(Math.round(((B-C)/A)*10000) / 100);

			//應檢附文件
			for(const key of ['checkInTime_doc41_AC', 'checkCoFail_doc41_AC', 'checkSandOFail_doc41_AC', 'checkCoUnreason_doc41_AC']){
				this.inputs[key] = this.inputForm[key] ? 'V' : '';
			}
			this.form.setInputs([this.inputs]);
			this.form.render();
		},
		getList() {
			this.loading = true;
			this.inputForm.maintainAll_Num32 = 0;

			let timeStart = moment(this.reportDate).day() == 0 
				? moment(this.reportDate).day(-6).format("YYYY-MM-DD") 
				: moment(this.reportDate).day(1).format("YYYY-MM-DD");
			if(moment(timeStart).month() != moment(this.reportDate).month()) timeStart = moment(this.reportDate).startOf('month').format("YYYY-MM-DD");
			const timeEnd = moment(this.reportDate).add(1, "d").format("YYYY-MM-DD");

			getCaseWarrantyCount({
				zipCode: Number(this.inputs.zipCode),
				timeStart,
				timeEnd
			}).then(response => {
				const result = response.data.result;
				// console.log(result);
				this.initPage = Number(result.caseTotal);
				this.inputForm.hole_Num41_AC = Number(result.caseDispatch_hole_AC);
				this.inputForm.sidewalk_Num41_AC = Number(result.caseDispatch_holeCover_AC);
				this.inputForm.crack_Num41_AC = Number(result.caseDispatch_crack_AC);
				this.inputForm.uplift_Num41_AC = Number(result.caseDispatch_uplift_AC);
				this.inputForm.sidewalk_Num41_FA = Number(result.caseDispatch_sidewalk_FA);

				this.setPDFinputs();
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		storeData(){
			this.loading = true;
			const inputs = JSON.parse(JSON.stringify(this.inputs));
			const storedContent = {
				initPage: this.initPage,
				inputs
			}
			let uploadForm = new FormData();
			uploadForm.append('checkDate', moment(this.checkDate).format("YYYY-MM-DD"));
			uploadForm.append('pageCount', 1);
			uploadForm.append('content', JSON.stringify(storedContent));

			setPerfContent(this.listQuery.perfContentId, uploadForm).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "提交成功",
						type: "success",
					});
				} 
				this.loading = false;
			}).catch(err => {
				console.log(err);
				this.loading = false;
			})
		},
		async getPDF() {
			return new Promise(resolve =>{
				generate({ template: this.form.getTemplate(), inputs: this.form.getInputs(), options: { font: this.form.getFont() } }).then((pdf) => {
					resolve(pdf);
				});
			});
		},
		handleDownload() {
			// console.log(this.form);
			generate({ template: this.form.getTemplate(), inputs: this.form.getInputs(), options: { font: this.form.getFont() } }).then((pdf) => {
				// console.log(pdf);
				const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
				// window.open(URL.createObjectURL(blob));

				const filename = "PI4-1.pdf"; 
				const file = new File([blob], filename, { type: 'application/pdf' });
				const link = document.createElement('a');
				const url = URL.createObjectURL(file);
				link.href = url;
				// console.log(link,url);
				link.download = file.name;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(url);
			});
		},
		handlePageTurn(type) {
			switch(type) {
				case 0:
					this.$router.push({
						path: "/PIReport/weekly/edit",
						query: { reportId: this.listQuery.reportId }
					})
					return;
				case -1:
					this.$router.push({
						path: "/PIReport/weekly/PI3_2_Att_2",
						query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[0], perfPages: -1, cidList: this.$route.query.cidList }
					})
					return;
				case 1:
					this.$router.push({
						path: "/PIReport/weekly/PI4_1_Att_1",
						query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[1], cidList: this.$route.query.cidList }
					})
					return;
				default:
					const date = moment(this.reportDate).format("YYYY-MM-DD");
					this.$router.push({
						path: "/PIReport/weekly/list",
						query: { zipCode: this.inputs.zipCode, timeStart: date, timeEnd: date }
					})
					break;
			}
		},
		formatDate(date){
			return moment(date).isValid() ? moment(date).format('YYYY-MM-DD') : "-";
		}
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.PI4_1
	.collapse-label
		width: 100%
		.el-collapse-item__header
			padding: 5px 25px
			background-color: #F2F6FC
			position: relative
			&.is-active
				background-color: rgba(#F2F6FC, 0.5)
				transition: 0.5s
			.el-collapse-item__arrow
				position: absolute
				left: 5px
		.el-collapse-item__content
			height: 100%
			padding: 10px 0 5px 0
</style>