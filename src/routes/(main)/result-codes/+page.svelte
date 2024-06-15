<svelte:head>
	<title>CE Boostup XII - Result Codes</title>
</svelte:head>

<div class="mx-2 mt-4 sm:mx-8 md:mx-12 lg:mx-16">
	<h1>Result Codes</h1>

	<h2>AC - Accepted</h2>
	<p>โค้ดที่ส่งสามารถทำงานได้ในข้อจำกัดทั้งหมด และให้คำตอบที่ถูกต้องใน Testcase นี้</p>

	<h2>WA - Wrong Answer</h2>
	<p>โค้ดที่ส่งสามารถทำงานได้ในข้อจำกัดทั้งหมด แต่ไม่สามารถให้คำตอบที่ถูกต้องใน Testcase นี้ได้</p>

	<h2>IR - Invalid Return</h2>
	<p>โค้ดที่ส่งเมื่อนำมา Run แล้วให้ค่า Return ที่ไม่ใช่ 0</p>

	<h2>RE - Runtime Error</h2>
	<p>
		โค้ดที่ส่งเมื่อนำมา Run แล้วเกิดข้อผิดพลาดในระหว่างการทำงาน เช่นเกิด Segmentation Fault หรือ
		Floating Point Arithmatic Exception
	</p>

	<h2>HNA - Header Not Allowed</h2>
	<p>โค้ดที่ส่งมีการใช้ Header File ที่โจทย์ข้อนั้นไม่ได้อนุญาติให้ใช้</p>

	<h2>FNA - Function Not Allowed</h2>
	<p>โค้ดที่ส่งมีการใช้ Function ที่โจทย์ข้อนั้นไม่ได้อนุญาติให้ใช้</p>

	<h2>TLE - Time Limit Exceeded</h2>
	<p>โค้ดที่ส่งใช้ระยะเวลาการทำงานนานเกินกว่าที่โจทย์กำหนด</p>

	<h2>MLE - Memory Limit Exceeded</h2>
	<p>โค้ดที่ส่งมีการใช้ Memory (RAM) มากเกินกว่าที่โจทย์กำหนด</p>

	<h2>OLE - Output Limit Exceeded</h2>
	<p>โค้ดที่ส่งมีการส่งข้อมูลออกผ่านทาง stdout (เช่นผ่านทาง printf) มากกว่า 16 MiB</p>

	<h2>CE - Compile Error</h2>
	<p>โค้ดที่ส่งเกิดข้อผิดพลาดในระหว่างการ Compile ทำให้ไม่สามารถ Compile ได้</p>

	<h2>CTLE - Compilation Time Limit Exceeded</h2>
	<p>โค้ดที่ส่งใช้เวลาการ Compile มากกว่า 5 วินาที</p>

	<h2>CMLE - Compilation Memory Limit Exceeded</h2>
	<p>โค้ดที่ส่งใช้ Memory (RAM) ในการ Compile มากกว่า 128 MiB</p>

	<h2>COLE - Compilation Output Limit Exceeded</h2>
	<p>โค้ดที่ส่งเมื่อ Compile แล้ว ได้ไฟล์ที่ใหญ่กว่า 64 MiB</p>

	<h2>IE - Internal Error</h2>
	<p>เกิดข้อผิดพลาดภายในระบบที่อาจไม่เกี่ยวกับโค้ดที่ส่ง</p>

	<h2>UE - Unknown Error</h2>
	<p>เกิดข้อผิดพลาดที่ไม่สามารถระบุได้</p>
</div>

<style lang="postcss">
	h1 {
		@apply mx-4 mb-4 text-3xl font-semibold;
	}

	h2 {
		@apply mx-6 mt-4 text-lg font-medium sm:mx-12;
	}

	p {
		@apply mx-8 text-base sm:mx-16;
	}
</style>
