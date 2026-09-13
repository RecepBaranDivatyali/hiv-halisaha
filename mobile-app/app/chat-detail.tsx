import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/use-auth';
import { dbService, MessageModel } from '@/services/dbService';

export default function ChatDetailScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = useStyles(theme);
  const scrollViewRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams<{ conversationId?: string; userName?: string; avatar?: string; recipientId?: string; title?: string }>();

  const otherUserName = params.userName || params.title || 'Sohbet';
  const otherAvatar = params.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuD61ghtvJ5sJMQ7y3fD6Z_Ofd2S-DzwZ9il8dq6Fso8NMmg-Tkq63ki6TyBmTGKXf_ywAxfY8d0QQXSdPpDl6ppdLL89aww_eFnmBSi_-QELpMWokrZFoAKoHyiqaFQ566c3N-JvTKbu2r8ZTFl1P3T2VEJ8tn1uNe9kzEfLPmbOut5nd7pdEu76Bc4M5oqcDoKZ9p4rnuG4YBC1M4ICV9DM5_xplUAGZS-xailrob1N-XgNYCXmqen_ioHfxLib6k6uReyvMAKisex';

  const chatId = params.conversationId || (params.recipientId ? [user?.uid || 'anon', params.recipientId].sort().join('_') : 'general_chat');

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<MessageModel[]>([]);

  useEffect(() => {
    const unsub = dbService.subscribeMessages(chatId, (newMsgs) => {
      setMessages(newMsgs);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    return () => {
      if (unsub) unsub();
    };
  }, [chatId]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;
    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await dbService.sendMessage(chatId, {
        senderId: user?.uid || 'anon',
        senderName: user?.name || 'Oyuncu',
        senderAvatar: user?.avatar,
        text: textToSend
      });
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 50);
    } catch (e) {
      console.log('Mesaj gönderme hatası:', e);
      Alert.alert('Hata', 'Mesaj gönderilemedi.');
    } finally {
      setIsSending(false);
    }
  };

  const formatMsgTime = (timeVal: any) => {
    if (!timeVal) return '';
    try {
      const date = typeof timeVal?.toDate === 'function' ? timeVal.toDate() : new Date(timeVal);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* TopAppBar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.iconBtnHover} onPress={() => router.back()} accessibilityLabel="Geri" accessibilityRole="button">
              <MaterialIcons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.headerProfileInfo}>
              <View style={styles.headerAvatarWrap}>
                <Image source={{ uri: otherAvatar }} style={styles.headerAvatar} />
              </View>
              <View>
                <Text style={styles.headerTitle}>{otherUserName}</Text>
                <Text style={styles.headerSubtitle}>CANLI SOHBET</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={[styles.iconBtnHover, { backgroundColor: theme.surfaceContainerHighest, borderRadius: 8 }]} onPress={() => Alert.alert('Arama', 'Sesli arama özelliği yakında eklenecektir.')} accessibilityLabel="Ara" accessibilityRole="button">
              <MaterialIcons name="call" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.chatScroll} 
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Date Indicator */}
          <View style={styles.dateIndicatorWrap}>
            <View style={styles.dateIndicator}>
              <Text style={styles.dateIndicatorText}>CANLI MESAJLAR</Text>
            </View>
          </View>

          {messages.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
              <MaterialIcons name="chat-bubble-outline" size={48} color={theme.surfaceContainerHighest} />
              <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: theme.textMuted, textAlign: 'center' }}>
                Henüz mesaj yok. İlk mesajı siz gönderin!
              </Text>
            </View>
          )}

          {/* Messages */}
          {messages.map((item) => {
            const isSelf = item.senderId === user?.uid;
            return (
              <View key={item.id}>
                {!isSelf ? (
                  <View style={styles.msgLeftWrap}>
                    <Text style={styles.msgSenderName}>{item.senderName}</Text>
                    <View style={styles.msgLeftBubble}>
                      <Text style={styles.msgLeftText}>{item.text}</Text>
                    </View>
                    <Text style={styles.msgTime}>
                      {formatMsgTime(item.createdAt)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.msgRightWrap}>
                    <View style={styles.msgRightBubble}>
                      <Text style={styles.msgRightText}>{item.text}</Text>
                    </View>
                    <View style={styles.msgRightMeta}>
                      <Text style={styles.msgTime}>
                        {formatMsgTime(item.createdAt)}
                      </Text>
                      <MaterialIcons name="done-all" size={14} color={theme.primary} />
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor={theme.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
            accessibilityLabel="Gönder"
            accessibilityRole="button"
          >
            <MaterialIcons name="send" size={20} color={theme.onPrimary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    backgroundColor: theme.surface
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconBtnHover: {
    padding: 8,
    borderRadius: 8
  },
  headerProfileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  headerAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden'
  },
  headerAvatar: {
    width: '100%',
    height: '100%'
  },
  headerTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 15,
    color: theme.text
  },
  headerSubtitle: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: theme.primary,
    fontWeight: 'bold'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  chatScroll: {
    padding: 16,
    paddingBottom: 24,
    gap: 16
  },
  dateIndicatorWrap: {
    alignItems: 'center',
    marginVertical: 8
  },
  dateIndicator: {
    backgroundColor: theme.surfaceContainerHighest,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  dateIndicatorText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.textMuted
  },
  msgLeftWrap: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    gap: 4
  },
  msgSenderName: {
    fontFamily: Fonts.label,
    fontSize: 11,
    color: theme.secondary,
    marginLeft: 4
  },
  msgLeftBubble: {
    backgroundColor: theme.surfaceContainerHighest,
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4
  },
  msgLeftText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: theme.text,
    lineHeight: 20
  },
  msgRightWrap: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    gap: 4
  },
  msgRightBubble: {
    backgroundColor: theme.primary,
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4
  },
  msgRightText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: theme.onPrimary,
    lineHeight: 20,
    fontWeight: '500'
  },
  msgRightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4
  },
  msgTime: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    gap: 10
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: theme.surfaceContainer,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: theme.text
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
