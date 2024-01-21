import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  FlatList
} from 'react-native'
import {
  Entypo,
  AntDesign
} from '@expo/vector-icons'
import jwt_decode from "jwt-decode"
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import UserProfile from '../../../components/UserProfile'
import ConnectionRequest from '../../../components/ConnectionRequest'
import { useRouter } from 'expo-router'
const index = () => {
  const router = useRouter()
  const [userId, setUserId] = useState()
  const [user, setUser] = useState()
  const [users, setUsers] = useState()
  const [connectionRequests, setConnectionRequests] = useState([]);
  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem("token")
      const decodedToken = jwt_decode(token)
      const userId = decodedToken.userId
      setUserId(userId)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (userId) {
      fetchUserProfile()
    }
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`http://192.168.68.109:8000/profile/${userId}`)
      const userData = res.data
      setUser(userData)
    } catch (error) {
      console.log("Error fetching user profile: ", error)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchUsers();
    }
  }, [userId]);
  const fetchUsers = async () => {
    axios
      .get(`http://192.168.68.109:8000/users/${userId}`)
      .then((response) => {
        setUsers(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    if(userId) {
      fetchFriendRequests()
    }
  },[userId])

  const fetchFriendRequests = async () => {
    try {
      const res = await axios.get(`http://192.168.68.109:8000/connection-request/${userId}`)
      if (res.status === 200) {
        const connectionRequetsData = res.data?.map((friendRequest) => ({
          id: friendRequest._id,
          name: friendRequest.name,
          email: friendRequest.email,
          image: friendRequest.profileImage
        }))
        setConnectionRequests(connectionRequetsData);
      }
    } catch (error) {
      
    }
  }

  const removeToken = async () => {
    await AsyncStorage.removeItem("token")
    router.replace("/(authenticate)/login")
  }
  console.log("connectionRequests: ",connectionRequests)

  
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "white" }}>
      <Pressable
        onPress={() => router.push("/network/connections")}
        style={{
          marginTop: 10,
          marginHorizontal: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600" }}>
          Manage My Network
        </Text>
        <AntDesign name="arrowright" size={22} color="black" />
      </Pressable>

      <View
        style={{ borderColor: "#E0E0E0", borderWidth: 2, marginVertical: 10 }}
      />

      <View
        style={{
          marginTop: 10,
          marginHorizontal: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600" }}>Invitations (0)</Text>
        <AntDesign name="arrowright" size={22} color="black" />
      </View>

      <View
        style={{ borderColor: "#E0E0E0", borderWidth: 2, marginVertical: 10 }}
      />

      <View>
        {connectionRequests?.map((item, index) => (
          <ConnectionRequest
            item={item}
            key={index}
            connectionRequests={connectionRequests}
            setConnectionRequests={setConnectionRequests}
            userId={userId}
          />
        ))}
      </View>

      <View style={{ marginHorizontal: 15 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text>Grow your network faster</Text>
          <Entypo name="cross" size={24} color="black" />
        </View>

        <Text>
          Find and contact the right people. Plus see who's viewed your profile
        </Text>
        <View
          style={{
            backgroundColor: "#FFC72C",
            width: 140,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 25,
            marginTop: 8,
          }}
        >
          <Text
            style={{ textAlign: "center", color: "white", fontWeight: "600" }}
          >
            Try Premium
          </Text>
        </View>
      </View>
      <FlatList
        data={users}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        numColumns={2}
        keyExtractor={(item) => item._id}
        renderItem={({ item, key }) => (
          <UserProfile userId={userId} item={item} key={index} />
        )}
      />
      <Pressable
        style={{padding: 10, backgroundColor: "grey", marginTop: 30}}
        onPress={removeToken}
      >
        <Text>Remove Token</Text>
      </Pressable>
    </ScrollView>
  )
}

export default index

const styles = StyleSheet.create({})