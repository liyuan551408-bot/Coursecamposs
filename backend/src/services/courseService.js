// 模拟从数据库获取课程列表
// 数据库负责人以后会在这里引入 prisma 并写真实的查询逻辑
const getAllCourses = async () => {
    // 模拟数据返回
    return [
        { id: 1, title: 'Introduction to Software Engineering', code: '159.272' },
        { id: 2, title: 'Programming Project', code: '159.333' }
    ];
};

module.exports = {
    getAllCourses
};