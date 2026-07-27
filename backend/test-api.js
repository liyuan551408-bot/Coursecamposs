// test-api.js

async function runTest() {
    console.log("⏳ 正在向本地后端发送 POST 请求...");
    console.log("🎯 目标接口: http://localhost:3000/api/ai-summary\n");

    try {
        // 使用原生的 fetch 发送请求
        const response = await fetch('http://localhost:3000/api/ai-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // 告诉后端我们发送的是 JSON 数据
            },
            body: JSON.stringify({
                // 模拟前端发来的评价数据
                reviews: [
                    "这门课干货很多，能学到非常实用的编程知识。",
                    "每周的作业量比较大，需要花不少时间，期末考试难度挺高的。",
                    "老师讲课很有条理，但是助教回复问题的速度比较慢。"
                ]
            })
        });

        // 解析后端返回的 JSON 数据
        const result = await response.json();

        if (response.ok) {
            console.log("✅ 测试成功！后端返回数据如下：");
            console.log("----------------------------------------");
            console.log(result);
            console.log("----------------------------------------");
        } else {
            console.log("⚠️ 后端返回了错误状态码:", response.status);
            console.log("错误信息:", result);
        }

    } catch (error) {
        console.error("❌ 请求失败！请确认你的后端服务 (node app.js) 是否正在运行中。");
        console.error("具体报错:", error.message);
    }
}

// 执行测试逻辑
runTest();