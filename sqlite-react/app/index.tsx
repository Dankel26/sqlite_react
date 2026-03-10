import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Button, Text } from 'react-native'



const indexPage = () => {

    const router = useRouter();

    return <View>
        <Button
            title="Programas"
            onPress={() => {
                router.navigate('/programas')
            }}
        />
       <Button
            title="Estudiantes"
            onPress={() => {
                router.navigate('/estudiantes')
            }}
        />
    </View>
}
export default indexPage;