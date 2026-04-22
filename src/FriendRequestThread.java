public class FriendRequestThread implements Runnable {

    private final UniversityStudent sender;
    private final UniversityStudent receiver;

    public FriendRequestThread(UniversityStudent sender, UniversityStudent receiver) {
        // Constructor
        this.sender = sender;
        this.receiver = receiver;
    }

    @Override
    public void run() {
        UniversityStudent first;
        UniversityStudent second;

        // determine the locking order alphabetically by student name
        if (sender.name.compareTo(receiver.name) < 0) {
            first = sender;
            second = receiver;
        } else {
            first = receiver;
            second = sender;
        }

        // lock on the first student, then the second
        synchronized (first) {
            synchronized (second) {
                sender.addFriend(receiver);
                receiver.addFriend(sender);
                System.out.println(sender.name + " sent a friend request to " + receiver.name + " [Thread: " + Thread.currentThread().getName() + "]");
            }
        }
    }
}
