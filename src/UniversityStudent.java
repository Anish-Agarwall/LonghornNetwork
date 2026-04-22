import java.util.*;

public class UniversityStudent extends Student {
    // TODO: Constructor and additional methods to be implemented

    private UniversityStudent roommate;
    private List<UniversityStudent> friends;
    private Map<String, List<String>> chatHistory;

    // constructor
    public UniversityStudent(String name, int age, String gender, int year, String major, double gpa, List<String> roommatePreferences, List<String> previousInternships) {
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.year = year;
        this.major = major;
        this.gpa = gpa;
        this.roommatePreferences = new ArrayList<>(roommatePreferences);
        this.previousInternships = new ArrayList<>(previousInternships);
        this.friends = new ArrayList<>();
        this.chatHistory = new HashMap<>();
        this.roommate = null;
    }


    @Override
    public int calculateConnectionStrength(Student other) {
        // if not a studnet, just make it 0
        if (!(other instanceof UniversityStudent)){
            return 0;
        }

        UniversityStudent realOther = (UniversityStudent) other;
        int strength = 0;

        // 4 for roomamtes
        if (this.roommate != null && this.roommate.name.equals(realOther.name)) {
            strength += 4;
        }

        // 3 for each shared internship
        for (String internship : this.previousInternships) {
            if (!internship.equals("None") && realOther.previousInternships.contains(internship)) {
                strength += 3;
            }
        }

        // 2 for same majot
        if (this.major != null && this.major.equals(realOther.major)) {
            strength += 2;
        }

        // 1 for same age
        if (this.age == realOther.age) {
            strength += 1;
        }

        return strength;
    }

    // getter for roomater
    public UniversityStudent getRoommate() {
        return roommate;
    }

    // setter for roommate
    public void setRoommate(UniversityStudent roommate) {
        this.roommate = roommate;
    }

    // adds a friend threadsage
    public synchronized void addFriend(UniversityStudent friend) {
        if (!friends.contains(friend)) {
            friends.add(friend);
        }
    }

    // getter for friend
    public List<UniversityStudent> getFriends() {
        return friends;
    }

    // add message
    public synchronized void addMessage(String otherName, String message) {
        chatHistory.computeIfAbsent(otherName, k -> new ArrayList<>()).add(message);
    }

    // get chat histoty
    public Map<String, List<String>> getChatHistory() {
        return chatHistory;
    }

    // to string
    @Override
    public String toString() {
        return "UniversityStudent{name='" + name + "', age=" + age + ", gender='" + gender + "', year=" + year + ", major='" + major + "', gpa=" + gpa + ", roommatePreferences=" + roommatePreferences + ", previousInternships=" + previousInternships + "}";
    }


}

