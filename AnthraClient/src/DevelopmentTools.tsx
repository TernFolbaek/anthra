import React from 'react';
import axios from 'axios';

const DevelopmentTools = () => {
    const createTestUsers = async () => {
        try {
            await axios.post('http://localhost:5000/create-test-users');
        } catch (error) {
            console.error('Error creating test users:', error);
        }
    };

    const deleteTestUsers = async () => {
        try {
            await axios.post('http://localhost:5000/delete-test-users');
        } catch (error) {
            console.error('Error deleting test users:', error);
        }
    };

    return (
        <div style={{ position: 'relative', bottom: 10, left: 10, display: 'flex', justifyContent: 'center', gap: '10px' , fontSize: '20px', backgroundColor: 'white'}}>
            <button onClick={createTestUsers}>Create 5 Test Users</button>
            <button onClick={deleteTestUsers}>Delete Test Users</button>
        </div>
    );
};

export default DevelopmentTools;
