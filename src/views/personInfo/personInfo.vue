<template>
	<div class="app-container">
		<h2>人事資料表</h2>

		<el-row :gutter="24">
      <!-- 左邊 -->
			<el-col :span="10"></el-col>
      <!-- 右邊 -->
			<el-col :span="14" ref="container" />
		</el-row>
	</div>
</template>

<script>
import moment from "moment";
import { generate } from '@pdfme/generator';
import { Form } from '@pdfme/ui';

export default {
  name: 'personalInformation',
  components: { },
  data() {
    return {
      inputs: {}
    }
    // 左邊輸入欄位資料
  },
  computed: { },
  watch: {},
  created() {},
  mounted() {
    this.initPDF(); 
  },
  methods: {
    async initPDF() {
			return new Promise(resolve => {
				fetch(`/assets/pdf/personInfo.json?t=${Date.now()}`).then(async (response) => {
					const domContainer = this.$refs.container.$el;
					this.template = await response.json();

          // 讀取中文字
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

					// const changeInput = (arg) => {
					// 	if(['caseReportTotal', 'ACTotal_Obs', 'ACTotal_Reg', 'facTotal_Obs', 'facTotal_Reg'].includes(arg.key)) this.inputForm[arg.key] = parseInt(arg.value);
					// 	if(['caseReportImg', 'caseReportImg_neo1', 'caseReportImg_neo2','caseReportImg_neo3'].includes(arg.key)) {
					// 		// console.log(arg);
					// 		if(this.schemasOri[arg.key]) {
					// 			this.template.schemas[0][arg.key] = JSON.parse(JSON.stringify(this.schemasOri[arg.key]));
					// 			delete this.schemasOri[arg.key];
					// 			this.form.updateTemplate(this.template);
					// 		}

					// 		this.inputs[arg.key] = arg.value;

					// 		const img = new Image();
					// 		img.onload = () => {
					// 			// console.log(img.width, img.height);
					// 			const templateWidth = this.template.schemas[0][arg.key].width;
					// 			const templateHeight = this.template.schemas[0][arg.key].height;
					// 			const ratio = Math.min(templateWidth / img.width, templateHeight / img.height);
					// 			// console.log(ratio);

					// 			this.schemasOri[arg.key] = JSON.parse(JSON.stringify(this.template.schemas[0][arg.key]));
					// 			this.template.schemas[0][arg.key].position.x = this.template.schemas[0][arg.key].position.x + (this.template.schemas[0][arg.key].width - img.width * ratio) / 2;
					// 			this.template.schemas[0][arg.key].position.y = this.template.schemas[0][arg.key].position.y + (this.template.schemas[0][arg.key].height - img.height * ratio) / 2;
					// 			this.template.schemas[0][arg.key].width = img.width * ratio;
					// 			this.template.schemas[0][arg.key].height = img.height * ratio;
					// 			this.form.updateTemplate(this.template);
					// 		}
					// 		img.src = arg.value;
					// 	}
					// }

					this.form = new Form({ domContainer, template: this.template, inputs: [ this.inputs ], options: { font } });
					// this.form.onChangeInput(arg => changeInput(arg));

					for(const [key, value] of Object.entries(this.inputs)) changeInput({ key, value });
					if(Object.keys(this.list.content).length == 0) this.getList();
					else this.setPDFinputs();
					
					resolve();
				})
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

				const filename = "personInfo.pdf"; 
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
  }
}
</script>