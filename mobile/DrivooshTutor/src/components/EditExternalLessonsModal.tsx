import React, { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Linking, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

interface EditExternalLessonsModalProps {
    isVisible: boolean;
    onClose: () => void;
    initialCount: number;
    initialVerified?: boolean;
    proofUrl?: string | null;
    onSave: (data: {
        externalLessonsCount: number;
        isVerified: boolean;
        proofUrl?: string | null;
        selectedFile?: DocumentPicker.DocumentPickerAsset | null;
    }) => Promise<void>;
}

export const EditExternalLessonsModal: React.FC<EditExternalLessonsModalProps> = ({
    isVisible,
    onClose,
    initialCount,
    initialVerified = false,
    proofUrl: initialProofUrl = null,
    onSave
}) => {
    const [countInput, setCountInput] = useState(String(initialCount));
    const [isVerified, setIsVerified] = useState(initialVerified);
    const [urlInput, setUrlInput] = useState(initialProofUrl || "");
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setCountInput(String(initialCount || 0));
        setIsVerified(Boolean(initialVerified));
        setUrlInput(initialProofUrl || "");
        setSelectedFile(null);
    }, [initialCount, initialVerified, initialProofUrl, isVisible]);

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["application/pdf", "image/*"],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedFile(result.assets[0]);
            }
        } catch (error) {
            console.error("Error picking document:", error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                externalLessonsCount: Number(countInput) || 0,
                isVerified,
                proofUrl: urlInput.trim() || null,
                selectedFile
            });
            onClose();
        } catch (error) {
            console.error("Error saving external lessons:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>עדכון שיעורים קודמים</Text>
                    <Text style={styles.modalSubTitle}>
                        הזן את מכסת השיעורים שבוצעו אצל מורים קודמים/ בי"ס קודם וצָרֵף אישור מאמת (קובץ או קישור).
                    </Text>

                    <View style={styles.section}>
                        <Text style={styles.label}>מספר שיעורים שנצברו:</Text>
                        <TextInput
                            style={[styles.input, styles.textCenter]}
                            keyboardType="number-pad"
                            value={countInput}
                            onChangeText={setCountInput}
                            maxLength={2}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setIsVerified(!isVerified)}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={isVerified ? "checkbox" : "square-outline"}
                            size={22}
                            color={isVerified ? "#00C2E8" : "#64748b"}
                        />
                        <Text style={styles.checkboxLabel}>מאשר את נכונות מכסת השיעורים</Text>
                    </TouchableOpacity>

                    <View style={styles.section}>
                        <Text style={styles.label}>מסמך אישור / הוכחה (קובץ או קישור):</Text>

                        {selectedFile ? (
                            <View style={styles.selectedFileBox}>
                                <TouchableOpacity onPress={() => setSelectedFile(null)}>
                                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                                </TouchableOpacity>
                                <Text style={styles.selectedFileName} numberOfLines={1}>{selectedFile.name}</Text>
                                <Ionicons name="document-text" size={18} color="#00C2E8" />
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.uploadBtn} onPress={handlePickDocument} activeOpacity={0.7}>
                                <Ionicons name="cloud-upload-outline" size={18} color="#007890" />
                                <Text style={styles.uploadBtnText}>
                                    {urlInput ? "החלף בקובץ מהמכשיר" : "העלה קובץ (PDF / תמונה)"}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <Text style={styles.subLabel}>או הדבק קישור ישיר למסמך (Google Drive / Dropbox):</Text>
                        <TextInput
                            style={styles.input}
                            value={urlInput}
                            onChangeText={setUrlInput}
                            placeholder="https://..."
                            autoCapitalize="none"
                            keyboardType="url"
                        />

                        {urlInput && !selectedFile ? (
                            <TouchableOpacity style={styles.proofLink} onPress={() => Linking.openURL(urlInput)}>
                                <Ionicons name="open-outline" size={14} color="#007890" />
                                <Text style={styles.proofLinkText}>פתח קישור לצפייה</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>שמור שינויים</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onClose} disabled={isSaving}>
                            <Text style={styles.cancelBtnText}>ביטול</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.5)", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
    modalContent: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 20, elevation: 5 },
    modalTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", textAlign: "right", marginBottom: 4 },
    modalSubTitle: { fontSize: 12, color: "#64748b", textAlign: "right", marginBottom: 16, lineHeight: 16 },
    section: { marginBottom: 12 },
    label: { fontSize: 12, fontWeight: "700", color: "#334155", textAlign: "right", marginBottom: 6 },
    subLabel: { fontSize: 11, color: "#64748b", textAlign: "right", marginTop: 8, marginBottom: 4 },
    input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: "#0f172a", textAlign: "right" },
    textCenter: { textAlign: "center", fontSize: 16, fontWeight: "700" },
    checkboxRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginBottom: 16 },
    checkboxLabel: { fontSize: 13, fontWeight: "600", color: "#334155" },
    uploadBtn: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: "#a7e4f1", borderStyle: "dashed", backgroundColor: "#f0fdfa", paddingVertical: 10, borderRadius: 10 },
    uploadBtnText: { fontSize: 13, fontWeight: "700", color: "#007890" },
    selectedFileBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f1f5f9", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    selectedFileName: { flex: 1, fontSize: 12, fontWeight: "600", color: "#334155", textAlign: "right", marginHorizontal: 8 },
    proofLink: { flexDirection: "row-reverse", alignItems: "center", gap: 6, marginTop: 6, alignSelf: "flex-end" },
    proofLinkText: { fontSize: 11, fontWeight: "700", color: "#007890" },
    modalActions: { flexDirection: "row-reverse", gap: 10, marginTop: 8 },
    btn: { flex: 1, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
    saveBtn: { backgroundColor: "#00C2E8" },
    cancelBtn: { backgroundColor: "#f1f5f9" },
    saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    cancelBtnText: { color: "#64748b", fontWeight: "700", fontSize: 14 }
});