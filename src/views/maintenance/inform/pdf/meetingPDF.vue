<template>
  <div style="height: 100vh">
    <iframe width="100%" height="100%" :src="pdfContent" />
  </div>
</template>


<script>
import moment from "moment";
import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);
import { getApplyTicketListPDF } from "@/api/dispatch";
import { getDTypeMap } from "@/api/type";

export default {
	name: "meetingPDF",
	components: { },
	props: {
    ApplyId: {
      type: Number,
      required: true
    }
	},
	data() {
		return {
			pdfContent: '',
      caseNo: [],
      dateDeadline: [],
      dateUpload: [],
      distressType: [],
      millingArea: [],
      millingDepth: [],
      millingLength: [],
      millingWidth: [],
      place: [],
      options: {
				DistressType: {},
				DistressTypeFlat: {},
				DistressLevel: {
					1: "輕",
					2: "中",
					3: "重"
				}
			},
		}
	},
  watch: {
    ApplyId() {
      this.getList();
    }
  },
	computed: {	},
  created() {
    this.initFont();
    getDTypeMap().then(response => {
			this.options.DistressType = response.data.distressTypeMap;
			this.options.DistressTypeFlat = Object.values(this.options.DistressType).reduce((acc, cur) => {
				for (const key in cur) acc[key] = cur[key];
				return acc;
			}, {});
		})
  },
	methods: {
    initFont() {
      // Load font
      const readBlob = (blob) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      };

      fetch('/assets/font/edukai-4.0.ttf')
        .then(res => res.blob())
        .then(async(blob) => {
          const fontDataUri = await readBlob(blob);
          const fontBase64String = fontDataUri.substr(fontDataUri.indexOf('base64,') + 7);

          // Initialize jsPDF with custom font
          this.pdfDoc = new jsPDF();
          this.pdfDoc.addFileToVFS("edukai.ttf", fontBase64String);
          this.pdfDoc.addFont("edukai.ttf", "edukai", "normal");
          this.pdfDoc.setFont("edukai");

          // this.getList();
        });
    },
    createPDF() {
      return new Promise((resolve, reject) => {
        this.pdfDoc.addPage();
        while(this.pdfDoc.internal.getNumberOfPages() > 1) this.pdfDoc.deletePage(1);

        const { width, height } = this.pdfDoc.internal.pageSize;
        this.pdfDoc.setFontSize(14);
        this.pdfDoc.text(`112年度道路預約式契約維護修繕工程第3標`, width/2, height-280, { align: 'center' });
        this.pdfDoc.text(`磐碩營造施工前會勘路段(第159次)`, width/2, height-270, { align: 'center' });

        this.pdfDoc.setFontSize(10);
        this.pdfDoc.text(`工程地點：(AC)${this.place[0]}(銑刨加鋪)`, width -196, height-260);
        this.pdfDoc.text(`頁次1/1`, width -27, height-260);

        const table1 = [
          ['項次', '道管系統案號', '地點', '施工前會勘', '核可文號', '施工前項次'],
        ];

        for (let i = 0; i < this.caseNo.length; i++) {
          table1.push([i + 1, this.caseNo[i], this.place[i], `第新 增次`, ``, ``]);
        }

        this.pdfDoc.autoTable({
          theme: 'plain',
          styles: { font: "edukai", fontSize: 10, lineWidth: 0.1, lineColor: 10 },
          body: table1,
          startY: height - 257,
          columnStyles: {
            0: { halign: 'center', valign: 'middle' },
            1: { halign: 'center', valign: 'middle' },
            2: { halign: 'center', valign: 'middle' },
            3: { halign: 'center', valign: 'middle' },
            4: { halign: 'center', valign: 'middle' },
            5: { halign: 'center', valign: 'middle' },
          },
        });

        this.pdfDoc.addPage();

        this.pdfDoc.setFontSize(14);
        this.pdfDoc.text(`112年度道路預約式契約維護修繕工程第3標`, width/2, height-280, { align: 'center' });
        this.pdfDoc.text(`磐碩營造施工前會勘路段(第159次)`, width/2, height-270, { align: 'center' });

        this.pdfDoc.setFontSize(10);
        this.pdfDoc.text(`工程地點：(AC)${this.place[0]}(銑刨加鋪)`, width -196, height-260);
        this.pdfDoc.text(`頁次1/1`, width -27, height-260);

        const table2 = [
          ['項次', '道管系統案號', '查報日期', '預定完工日期', '地點', '損壞類別', '面積', '長度', '寬度', '深度', '標線面積', '切割長度', '備註'],
        ];

        let areaTotal = 0; // 銑刨面積總和
        // 標線面積 切割長度 備註 還沒有資料
        for (let i = 0; i < this.caseNo.length; i++) {
          table2.push([i + 1, this.caseNo[i], moment(this.dateUpload[i]).format('YYYY-MM-DD'), moment(this.dateDeadline[i]).format('YYYY-MM-DD'), this.place[i], this.distressType[i], this.millingArea[i], {content: '', colSpan: 2}, this.millingDepth[i], '', '', '']);
          areaTotal += this.millingArea[i];
        }

        table2.push([{ content: `刨5cm面積合計：${areaTotal}　銑刨面積合計：`, colSpan: 6 }, areaTotal, { content: `標線/切割合計:`, colSpan: 2 }, '', '', '']);

        this.pdfDoc.autoTable({
          theme: 'plain',
          styles: { font: "edukai", fontSize: 10, lineWidth: 0.1, lineColor: 10 },
          body: table2,
          startY: height - 257,
          columnStyles: {
            0: { halign: 'center', valign: 'middle' },
            1: { halign: 'center', valign: 'middle' },
            2: { halign: 'center', valign: 'middle' },
            3: { halign: 'center', valign: 'middle' },
            4: { halign: 'center', valign: 'middle' },
            5: { halign: 'center', valign: 'middle' },
            6: { halign: 'center', valign: 'middle' },
            7: { halign: 'center', valign: 'middle' },
            8: { halign: 'center', valign: 'middle' },
            9: { halign: 'center', valign: 'middle' },
            10: { halign: 'center', valign: 'middle' },
            11: { halign: 'center', valign: 'middle' },
            12: { halign: 'center', valign: 'middle' },
          },
        });

        this.pdfDoc.addPage();

        resolve();
      });
    },
    getList() {
      this.caseNo = [];
      this.dateDeadline = [];
      this.dateUpload = [];
      this.distressType = [];
      this.millingArea = [];
      this.millingDepth = [];
      this.millingLength =  [];
      this.millingWidth = [];
      this.place = [];

      // Fetch PDF data from API
      getApplyTicketListPDF({ ApplyId: this.ApplyId }).then(response => {
        const list = response.data.list;
        console.log('list', list);

        for (let i = 0; i < list.length; i++) {
          this.caseNo.push(list[i].CaseNo);
          this.dateDeadline.push(list[i].DateDeadline);
          this.dateUpload.push(list[i].DateUpload);
          this.distressType.push(list[i].DistressType);
          this.millingArea.push(list[i].MillingArea);
          this.millingDepth.push(list[i].MillingDepth);
          this.millingLength.push(list[i].MillingLength);
          this.millingWidth.push(list[i].MillingWidth);
          this.place.push(list[i].Place);
        }

        // Create PDF content
        this.createPDF().then(() => {
          // Render the content of this.pdfDoc into the component
          this.pdfContent = this.pdfDoc.output('datauristring');

          // this.pdfDoc.save(`路勘.pdf`);
          console.log('PDF content rendered!');
        });

      }).catch(error => {
        console.error('Error getting PDF data:', error);
      });
    }
  }
}
</script>

