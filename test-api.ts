import { coursesAPI } from './src/services/apiClient';

async function test() {
    try {
        const courses = await coursesAPI.getAll();
        console.log('Courses fetched:', courses.map(c => c.title || c.name));
    } catch (e) {
        console.error(e);
    }
}

test();
