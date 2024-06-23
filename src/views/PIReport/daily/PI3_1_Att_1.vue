<template>
	<div class="app-container PI3_1-Att_1" v-loading="loading">
		<h2>PI3.1附件</h2>

		<el-button v-if="pageTurn[0] != -1" icon="el-icon-arrow-left" size="mini" plain :disabled="pageTurn[0] == -1" @click="handlePageTurn(-1)">PI3.1</el-button>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn()">日報表</el-button>
		<span> > </span>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn(0)">{{ districtList[inputs.zipCode].name }} ({{ formatDate(reportDate) }})</el-button>
		<el-button v-if="pageTurn[1] != -1" type="primary" icon="el-icon-arrow-right" size="mini" plain :disabled="pageTurn[1] == -1"  @click="handlePageTurn(1)" />

		<el-row :gutter="24">
			<el-col :span="10">
				<el-card shadow="never" style="width: 400px; margin: 40px auto; padding: 5px 10px;">
					<el-form label-width="100px">
						<div style="display:flex;justify-content:space-between;align-items: center">
							<h3>工安登錄</h3>
							<el-button-group>
								<el-button type="primary" plain icon="el-icon-document" size="small" @click="handleDownload()">輸出</el-button>
								<!-- <el-button type="info" icon="el-icon-refresh" size="small" @click="getList()">刷新</el-button> -->
								<el-button class="filter-item" type="success" icon="el-icon-document" size="small" @click="storeData">儲存</el-button>
							</el-button-group>
						</div>
						<el-divider />
						<el-form-item label="起始頁碼">
							<el-input-number v-model="initPage" controls-position="right" :min="1" @change="setPDFinputs" />
						</el-form-item>
						<el-form-item label="檢查日期">
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
						<el-form-item label="頁數調整">
							<el-button-group>
								<el-button type="success" size="small" icon="el-icon-plus" @click="addPage()" />
								<el-button type="danger" size="small" icon="el-icon-minus" :disabled="template.schemas != undefined && template.schemas.length <= 2" @click="removePage()" />
								<span v-if="template.schemas != undefined" style="margin-left: 5px">(目前頁數: {{ template.schemas.length }})</span>
							</el-button-group>
						</el-form-item>
						<el-collapse v-model="activeName">
							<el-collapse-item v-for="(inputForm, index) in inputFormArr" :key="`form_${index}`" class="collapse-label" :title="`${inputForm.serialNumber} (P${index+1})`" :name="index">
								<template slot="title">
									<span>{{ inputForm.serialNumber }}</span>
									<el-button class="btn-remove" type="danger" size="mini" plain :disabled="template.schemas != undefined && template.schemas.length <= 2||index==0" @click="removePage(index)">刪除</el-button>
								</template>
								<el-form-item label="項目">
									<el-checkbox v-model="inputForm.checkVest" @change="setPDFinputs">反光背心</el-checkbox>
									<br/>
									<el-checkbox v-model="inputForm.checkIdCard" @change="setPDFinputs">識別證</el-checkbox>
									<br/>
									<el-checkbox v-if="index==0" v-model="inputForm.checkWhistle" @change="setPDFinputs">哨子</el-checkbox>
									<el-checkbox v-else-if="index!=0" v-model="inputForm.checkWhistle" @change="setPDFinputs">工程帽</el-checkbox>
								</el-form-item>
								<el-form-item label="檢查人數">
									<el-input-number v-model="inputForm.checkNum" controls-position="right" :min="0" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="未符人數">
									<el-input-number v-model="inputForm.failNum" controls-position="right" :min="0" :max="inputForm.checkNum" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="原因">
									<el-input v-model="inputForm.reason" @change="setPDFinputs" />
								</el-form-item>
							</el-collapse-item>
						</el-collapse>
					</el-form>
				</el-card>
			</el-col>
			<el-col :span="14" ref="container" id="container" />
		</el-row>
	</div>
</template>

<script>
import moment from "moment";
import { generate } from '@pdfme/generator';
import { Form } from '@pdfme/ui';
import { PDFDocument } from 'pdf-lib';
import { getPerfContent, setPerfContent } from "@/api/PI";

export default {
	name: "PI3_1_Att_1",
	components: { },
	data() {
		return {
			loading: true,
			initPage: 5,
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
			activeName: [0],
			pageTurn: [-1, -1],
			template: {},
			inputFormArr: [
				{
					serialNumber: "",
					checkVest: true,		// 反光背心
					checkIdCard: true,	// 識別證
					checkWhistle: true,	// 哨子
					checkNum: 0,
					failNum: 0,
					reason: "無"
				}
			],
			inputs: {
				contractName: '111年度中山區道路巡查維護修繕成效式契約', 
				companyName: '聖東營造股份有限公司',
				serialNumber1: '1111102105',
				serialNumber2: '1111102106',
				date: '111年11月02日',
				zipCode: '104',
				district: '中山區',
				checkVest1: 'V',		// 反光背心
				checkIdCard1: 'V',	// 識別證
				checkWhistle1: 'V',	// 哨子
				checkNum1: '0',
				passNum1: '0',
				failNum1: '0',
				reason1: '無',
				info1: '無未滿足',
				info2: '無未滿足',
				info3: '無未滿足'
			}			
		};
	},
	computed: { },
	watch: {},
	async created() {	
		this.schemasOri = {};

			if(this.$route.query.contentId) {
			this.listQuery.reportId = this.$route.query.reportId;
			this.listQuery.perfContentId = this.$route.query.contentId;

			const cidList = this.$route.query.cidList.split(",");
			const pageIndex = cidList.indexOf(String(this.$route.query.contentId));
			this.pageTurn = [ 
				Number(pageIndex) == 0 ? -1 : cidList[pageIndex-1], 
				Number(pageIndex) == cidList.length - 1 ? -1 : cidList[pageIndex+1] 
			];

			this.setData(this.listQuery.perfContentId);
		} else this.$router.push({ path: "/PIReport/daily/list" });
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

							// NOTE: 將image轉成dataURI (不然pdfme generate會報錯)
							for(const key in this.inputs) {
								if(key.includes('Img') && this.inputs[key].length != 0) {
									await fetch(this.inputs[key])
										.then(res => res.blob())
										.then(blob => {
											const reader = new FileReader();
											reader.onloadend = () => { this.inputs[key] = reader.result };
											reader.readAsDataURL(blob);
										})
								}
							}

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
				fetch(`/assets/pdf/daily/PI3_1-Att.json?t=${Date.now()}`).then(async (response) => {
					const domContainer = this.$refs.container.$el;
					this.template = await response.json();

					const font = {
						edukai: {
							data: await fetch('/assets/font/edukai-4.0.ttf').then(res => res.arrayBuffer()),
							fallback: true
						},
						// NotoSansTC: {
						// 	data: await fetch('/assets/font/NotoSansTC-Regular.ttf').then(res => res.arrayBuffer()),
						// 	fallback: true
						// }
					};

					const changeInput = (arg) => {
						// console.log(arg);
						const [key, index] = arg.key.split(/([a-zA-Z]+)(\d?)/g).filter(s => s.length > 0);
						// console.log(key, index);
						if( index < this.inputFormArr.length && ['serialNumber'].includes(key)) {
							if(this.inputFormArr[index-1] == undefined) this.inputFormArr[index-1] = {};
							this.inputFormArr[index-1][key] = arg.value;
						}
						if(['checkVest', 'checkIdCard', 'checkWhistle'].includes(key)) {
							if(this.inputFormArr[index-1] == undefined) this.inputFormArr[index-1] = {};
							this.inputFormArr[index-1][key] = (arg.value == 'V' || arg.value == 'v');
						}
						if(['checkNum', 'failNum', 'passNum'].includes(key)) {
							if(this.inputFormArr[index-1] == undefined) this.inputFormArr[index-1] = {};
							this.inputFormArr[index-1][key] = Number(arg.value);
						}
						if(['reason'].includes(key)) {
							if(this.inputFormArr[index-1] == undefined) this.inputFormArr[index-1] = {};
							this.inputFormArr[index-1][key] = arg.value;
						}

						if(key.includes('checkImg')) {
							if(this.schemasOri[index-1] && this.schemasOri[index-1][arg.key]) {
								this.template.schemas[index-1][arg.key] = JSON.parse(JSON.stringify(this.schemasOri[index-1][arg.key]));
								delete this.schemasOri[index-1][arg.key];
								this.form.updateTemplate(this.template);
							}

							const img = new Image();
							img.onload = () => {
								// 照片壓縮
								const canvas = document.createElement('canvas');
								// console.log("image: ", img.width, img.height);
								const scale = Math.max(img.width, img.height) >= 1024 ? 1024/Math.max(img.width, img.height) : 1;
								canvas.width = img.width * scale;
								canvas.height = img.height * scale;
								const canvasContext = canvas.getContext('2d');
								canvasContext.drawImage(img, 0, 0, canvas.width, canvas.height);
								this.inputs[arg.key] = canvas.toDataURL("image/jpeg", 0.8);

								// 調整比例
								const templateWidth = this.template.schemas[index-1][arg.key].width;
								const templateHeight = this.template.schemas[index-1][arg.key].height;
								const ratio = Math.min(templateWidth / img.width, templateHeight / img.height);
								// console.log(ratio);

								if(!this.schemasOri.hasOwnProperty(index-1)) this.schemasOri[index-1] = {};
								this.schemasOri[index-1][arg.key] = JSON.parse(JSON.stringify(this.template.schemas[index-1][arg.key]));
								this.template.schemas[index-1][arg.key].position.x = this.template.schemas[index-1][arg.key].position.x + (this.template.schemas[index-1][arg.key].width - img.width * ratio) / 2;
								this.template.schemas[index-1][arg.key].position.y = this.template.schemas[index-1][arg.key].position.y + (this.template.schemas[index-1][arg.key].height - img.height * ratio) / 2;
								this.template.schemas[index-1][arg.key].width = img.width * ratio;
								this.template.schemas[index-1][arg.key].height = img.height * ratio;
								this.form.updateTemplate(this.template);
							}
							img.src = arg.value;
						}
					}

					this.form = new Form({ domContainer, template: this.template, inputs: [ this.inputs ], options: { font } });
					this.form.onChangeInput(arg => changeInput(arg));

					if(Object.keys(this.list.content).length != 0) {
						for(let i = 1; i < this.list.pageCount-1; i++) await this.addPage(true);
					}

					for(const [key, value] of Object.entries(this.inputs)) changeInput({ key, value });

					this.setPDFinputs();
					
					resolve();
				})
			})
		},
		async addPage(init = false) {
			this.loading = true;

			//Step1: 合併PDF
			const ori_pdfUint8 = Uint8Array.from(window.atob(this.template.basePdf.replace(/^data:application\/pdf;base64,/, '')), c => c.charCodeAt(0));
			const ori_pdf = await PDFDocument.load(ori_pdfUint8.buffer);

			const addTemplate = await fetch(`/assets/pdf/daily/PI3_1-Att_1.json?t=${Date.now()}`).then(response => response.json());
			const add_pdfUint8 = Uint8Array.from(window.atob(addTemplate.basePdf.replace(/^data:application\/pdf;base64,/, '')), c => c.charCodeAt(0));
			const add_pdf = await PDFDocument.load(add_pdfUint8.buffer);
			const mergedPdf = await PDFDocument.create();

			const ori_copiedPages = await mergedPdf.copyPages(ori_pdf, ori_pdf.getPageIndices());
			const [ add_copiedPage ] = await mergedPdf.copyPages(add_pdf, [0]);
			ori_copiedPages.forEach(page => mergedPdf.addPage(page));
			mergedPdf.insertPage(ori_pdf.getPageCount()-1, add_copiedPage);

			this.template.basePdf = await mergedPdf.saveAsBase64({ dataUri: true });

			//Step2: 調整欄位
			this.template.schemas.splice(this.template.schemas.length-1, 0, addTemplate.schemas[0]);

			this.inputFormArr.push({
				serialNumber: "",
				checkVest: true,		// 反光背心
				checkIdCard: true,	// 識別證
				checkWhistle: true,	// 工程帽
				checkNum: 0,
				failNum: 0,
				reason: "無"
			});

			this.setTemplate(init);
		},
		async removePage(index) {
			this.loading = true;

			//Step1: 移除頁面
			const ori_pdfUint8 = Uint8Array.from(window.atob(this.template.basePdf.replace(/^data:application\/pdf;base64,/, '')), c => c.charCodeAt(0));
			const ori_pdf = await PDFDocument.load(ori_pdfUint8.buffer);
			index = (index != undefined) ? index : ori_pdf.getPageCount()-2;
			ori_pdf.removePage(index);

			this.template.basePdf = await ori_pdf.saveAsBase64({ dataUri: true });

			//Step2: 調整欄位
			this.template.schemas.splice(index, 1);
			this.inputFormArr.splice(index, 1);
			this.setTemplate();
		},
		setTemplate(init) {
			for(let i=0; i<this.template.schemas.length; i++) {
				for(const keySpec of [ 'serialNumber', 'checkImg', 'checkVest', 'checkIdCard', 'checkWhistle', 'checkNum', 'failNum', 'passNum', 'reason' ]) {
					if(keySpec != 'serialNumber' && i == this.template.schemas.length-1) continue;
					const keyFilter = Object.keys(this.template.schemas[i]).filter(key => key.includes(keySpec))[0];
					if(keyFilter == `${keySpec}${i+1}`) continue;
					this.template.schemas[i][`${keySpec}${i+1}`] = this.template.schemas[i][keyFilter]; 
					delete this.template.schemas[i][keyFilter];
				}
			}

			this.form.updateTemplate(this.template);
			if(!init) this.setPDFinputs();
		},
		setPDFinputs() {
			//工程名稱
			this.inputs.district = this.districtList[this.inputs.zipCode].name;
			this.inputs.contractName = this.districtList[this.inputs.zipCode].tenderName;

			for(const key of [ 'serialNumber', 'checkVest', 'checkIdCard', 'checkWhistle', 'checkNum', 'failNum', 'passNum', 'reason' ]) {
				for(const inputKey in this.inputs) {
					if(inputKey.includes(key)) delete this.inputs[inputKey];
				}
			}

			//紀錄編號
			const reportDate = moment(this.reportDate).format("YYYY/MM/DD").split("/");
			reportDate[0] = Number(reportDate[0]) - 1911;
			for(let i=0; i < this.template.schemas.length; i++) {
				this.inputs[`serialNumber${i+1}`] = reportDate.join("") + "01" + String(i+this.initPage).padStart(2, '0');
			}
			//檢查日期
			const checkDate = moment(this.checkDate).format("YYYY/MM/DD").split("/");
			checkDate[0] = Number(checkDate[0]) - 1911;
			this.inputs.date = `${checkDate[0]}年${checkDate[1]}月${checkDate[2]}日`;

			for(let [ i, inputForm ] of this.inputFormArr.entries()) {
				inputForm.serialNumber = this.inputs[`serialNumber${i+1}`];
				if(inputForm.checkImg) this.inputs[`checkImg${i+1}`] = inputForm.checkImg;
				for(const key of [ 'checkVest', 'checkIdCard', 'checkWhistle' ]) this.inputs[`${key}${i+1}`] = inputForm[key] ? 'V' : '';
				this.inputs[`checkNum${i+1}`] = String(inputForm.checkNum);
				this.inputs[`failNum${i+1}`] = String(inputForm.failNum);
				this.inputs[`passNum${i+1}`] = String(inputForm.checkNum - inputForm.failNum);
				this.inputs[`reason${i+1}`] = inputForm.reason;
			}

			this.form.setInputs([this.inputs]);
			this.loading = false;
		},
		storeData(){
			this.loading = true;
			let imgObj = {}; 
			const inputs = JSON.parse(JSON.stringify(this.inputs));

			Object.keys(this.inputs).forEach(key => {
				if(key.includes('Img')) {
					imgObj[key] = this.inputs[key];
					inputs[key] = "";
				}
			})
			const storedContent = {
				initPage: this.initPage,
				inputs
			}
			let uploadForm = new FormData();
			uploadForm.append('checkDate', moment(this.checkDate).format("YYYY-MM-DD"));
			uploadForm.append('pageCount', this.inputFormArr.length + 1);
			uploadForm.append('content', JSON.stringify(storedContent));
			uploadForm.append('imgObj', JSON.stringify(imgObj));

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
			generate({ template: this.form.getTemplate(), inputs: this.form.getInputs(), options: { font: this.form.getFont() } }).then((pdf) => {
				const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
				// window.open(URL.createObjectURL(blob));

				const filename = "PI3-1附件.pdf"; 
				const file = new File([blob], filename, { type: 'application/pdf' });
				const link = document.createElement('a');
				const url = URL.createObjectURL(file);
				link.href = url;
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
						path: "/PIReport/daily/edit",
						query: { reportId: this.listQuery.reportId }
					})
					break;
				case -1:
					this.$router.push({
						path: "/PIReport/daily/PI3_1",
						query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[0], cidList: this.$route.query.cidList }
					})
					break;
				case 1:
					break;
				default:
					const date = moment(this.reportDate).format("YYYY-MM-DD");
					this.$router.push({
						path: "/PIReport/daily/list",
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
.PI3_1-Att_1
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
			.btn-remove
				margin-left: 5px
				padding: 3px 5px
				position: absolute
				right: 20px
		.el-collapse-item__content
			height: 100%
			padding-bottom: 5px
</style>